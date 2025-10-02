import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { MeetingType } from '../src/meeting-types/entities/meeting-type.entity';
import { Booking } from '../src/bookings/entities/booking.entity';
import { Repository } from 'typeorm';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let meetingTypeRepository: Repository<MeetingType>;
  let bookingRepository: Repository<Booking>;
  let accessToken: string;
  let testUser: User;
  let testMeetingType: MeetingType;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    meetingTypeRepository = moduleFixture.get<Repository<MeetingType>>(getRepositoryToken(MeetingType));
    bookingRepository = moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking));
    
    await app.init();

    // Create test user and get access token
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto);

    accessToken = response.body.access_token;
    testUser = response.body.user;

    // Create test meeting type
    const meetingTypeDto = {
      title: '30-minute Consultation',
      description: 'Quick consultation call',
      duration: 30,
      bufferBefore: 5,
      bufferAfter: 5,
      locationType: 'GOOGLE_MEET',
      minimumNotice: 60,
      maximumNotice: 10080,
      maxBookingsPerDay: 8,
      availabilityWindows: [
        {
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
        },
      ],
    };

    const meetingTypeResponse = await request(app.getHttpServer())
      .post('/meeting-types')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(meetingTypeDto);

    testMeetingType = meetingTypeResponse.body;
  });

  afterEach(async () => {
    // Clean up test data
    await bookingRepository.clear();
    await meetingTypeRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('/bookings (POST)', () => {
    it('should create a booking successfully', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '+1234567890',
        guestNotes: 'Looking forward to our meeting',
        guestTimezone: 'America/New_York',
        startTime: tomorrow.toISOString(),
      };

      return request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.guestName).toBe(createBookingDto.guestName);
          expect(res.body.guestEmail).toBe(createBookingDto.guestEmail);
          expect(res.body.status).toBe('CONFIRMED');
          expect(res.body).toHaveProperty('rescheduleToken');
          expect(res.body).toHaveProperty('cancelToken');
        });
    });

    it('should return 404 for non-existent meeting type', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: 'non-existent-id',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      return request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(404);
    });

    it('should return 400 for conflicting time slot', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      // Create first booking
      await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(201);

      // Try to create second booking at same time
      return request(app.getHttpServer())
        .post('/bookings')
        .send({
          ...createBookingDto,
          guestName: 'Another Guest',
          guestEmail: 'another@example.com',
        })
        .expect(400);
    });
  });

  describe('/bookings (GET)', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto);

      testBooking = response.body;
    });

    it('should get user bookings with authentication', () => {
      return request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('guestName');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/bookings')
        .expect(401);
    });

    it('should get upcoming bookings', () => {
      return request(app.getHttpServer())
        .get('/bookings/upcoming')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/bookings/:id (GET)', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto);

      testBooking = response.body;
    });

    it('should get booking by id', () => {
      return request(app.getHttpServer())
        .get(`/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testBooking.id);
          expect(res.body.guestName).toBe(testBooking.guestName);
        });
    });

    it('should return 404 for non-existent booking', () => {
      return request(app.getHttpServer())
        .get('/bookings/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/bookings/:id/cancel (PATCH)', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto);

      testBooking = response.body;
    });

    it('should cancel booking successfully', () => {
      return request(app.getHttpServer())
        .patch(`/bookings/${testBooking.id}/cancel`)
        .send({ reason: 'Schedule conflict' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CANCELLED');
          expect(res.body.cancellationReason).toBe('Schedule conflict');
          expect(res.body).toHaveProperty('cancelledAt');
        });
    });

    it('should return 404 for non-existent booking', () => {
      return request(app.getHttpServer())
        .patch('/bookings/non-existent-id/cancel')
        .send({ reason: 'Test' })
        .expect(404);
    });
  });

  describe('/bookings/:id/reschedule (PATCH)', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const createBookingDto = {
        meetingTypeId: testMeetingType.id,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        startTime: tomorrow.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto);

      testBooking = response.body;
    });

    it('should reschedule booking successfully', () => {
      const newTime = new Date();
      newTime.setDate(newTime.getDate() + 2);
      newTime.setHours(14, 0, 0, 0); // 2:00 PM day after tomorrow

      return request(app.getHttpServer())
        .patch(`/bookings/${testBooking.id}/reschedule`)
        .send({ newStartTime: newTime.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(new Date(res.body.startTime)).toEqual(newTime);
          expect(res.body.rescheduleCount).toBe(1);
          expect(res.body).toHaveProperty('lastRescheduledAt');
          expect(res.body).toHaveProperty('originalStartTime');
        });
    });

    it('should return 404 for non-existent booking', () => {
      const newTime = new Date();
      newTime.setDate(newTime.getDate() + 2);
      newTime.setHours(14, 0, 0, 0);

      return request(app.getHttpServer())
        .patch('/bookings/non-existent-id/reschedule')
        .send({ newStartTime: newTime.toISOString() })
        .expect(404);
    });
  });
});
