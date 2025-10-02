import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: Repository<Booking>;
  let meetingTypesService: MeetingTypesService;
  let calendarService: CalendarService;
  let notificationsService: NotificationsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMeetingTypesService = {
    findOne: jest.fn(),
  };

  const mockCalendarService = {
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  const mockNotificationsService = {
    sendBookingConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
        {
          provide: MeetingTypesService,
          useValue: mockMeetingTypesService,
        },
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    meetingTypesService = module.get<MeetingTypesService>(MeetingTypesService);
    calendarService = module.get<CalendarService>(CalendarService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto = {
      meetingTypeId: 'meeting-type-1',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      guestPhone: '+1234567890',
      guestNotes: 'Looking forward to the meeting',
      guestTimezone: 'America/New_York',
      startTime: new Date('2024-01-15T10:00:00Z'),
    };

    const mockMeetingType = {
      id: 'meeting-type-1',
      userId: 'user-1',
      title: '30-minute Consultation',
      duration: 30,
      slug: '30min-consultation',
    };

    it('should create a booking successfully', async () => {
      const expectedBooking = {
        id: 'booking-1',
        ...createBookingDto,
        hostId: 'user-1',
        endTime: new Date('2024-01-15T10:30:00Z'),
        duration: 30,
        status: BookingStatus.CONFIRMED,
        rescheduleToken: expect.any(String),
        cancelToken: expect.any(String),
      };

      mockMeetingTypesService.findOne.mockResolvedValue(mockMeetingType);
      mockRepository.findOne.mockResolvedValue(null); // No conflicts
      mockRepository.create.mockReturnValue(expectedBooking);
      mockRepository.save.mockResolvedValue(expectedBooking);
      mockNotificationsService.sendBookingConfirmation.mockResolvedValue(undefined);

      // Mock findOne for the return call
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedBooking as any);

      const result = await service.create(createBookingDto);

      expect(meetingTypesService.findOne).toHaveBeenCalledWith(createBookingDto.meetingTypeId);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          hostId: mockMeetingType.userId,
          startTime: createBookingDto.startTime,
          status: BookingStatus.CONFIRMED,
        },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(notificationsService.sendBookingConfirmation).toHaveBeenCalled();
      expect(result).toEqual(expectedBooking);
    });

    it('should throw NotFoundException if meeting type not found', async () => {
      mockMeetingTypesService.findOne.mockResolvedValue(null);

      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
      expect(meetingTypesService.findOne).toHaveBeenCalledWith(createBookingDto.meetingTypeId);
    });

    it('should throw BadRequestException if time slot is already booked', async () => {
      const existingBooking = {
        id: 'existing-booking',
        startTime: createBookingDto.startTime,
        status: BookingStatus.CONFIRMED,
      };

      mockMeetingTypesService.findOne.mockResolvedValue(mockMeetingType);
      mockRepository.findOne.mockResolvedValue(existingBooking);

      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          hostId: mockMeetingType.userId,
          startTime: createBookingDto.startTime,
          status: BookingStatus.CONFIRMED,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      const bookingId = 'booking-1';
      const expectedBooking = {
        id: bookingId,
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        status: BookingStatus.CONFIRMED,
      };

      mockRepository.findOne.mockResolvedValue(expectedBooking);

      const result = await service.findOne(bookingId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: bookingId },
        relations: ['meetingType', 'host'],
      });
      expect(result).toEqual(expectedBooking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      const bookingId = 'non-existent-booking';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(bookingId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking successfully', async () => {
      const bookingId = 'booking-1';
      const reason = 'Schedule conflict';
      const booking = {
        id: bookingId,
        status: BookingStatus.CONFIRMED,
        guestName: 'John Doe',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(booking as any);
      mockRepository.save.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
        cancelledAt: expect.any(Date),
        cancellationReason: reason,
      });

      const result = await service.cancel(bookingId, reason);

      expect(service.findOne).toHaveBeenCalledWith(bookingId);
      expect(repository.save).toHaveBeenCalledWith({
        ...booking,
        status: BookingStatus.CANCELLED,
        cancelledAt: expect.any(Date),
        cancellationReason: reason,
      });
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException if booking cannot be cancelled', async () => {
      const bookingId = 'booking-1';
      const booking = {
        id: bookingId,
        status: BookingStatus.CANCELLED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(booking as any);

      await expect(service.cancel(bookingId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reschedule', () => {
    it('should reschedule a booking successfully', async () => {
      const bookingId = 'booking-1';
      const newStartTime = new Date('2024-01-16T14:00:00Z');
      const booking = {
        id: bookingId,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2024-01-15T10:00:00Z'),
        duration: 30,
        rescheduleCount: 0,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(booking as any);
      mockRepository.save.mockResolvedValue({
        ...booking,
        startTime: newStartTime,
        endTime: new Date('2024-01-16T14:30:00Z'),
        originalStartTime: booking.startTime,
        rescheduleCount: 1,
        lastRescheduledAt: expect.any(Date),
      });

      const result = await service.reschedule(bookingId, newStartTime);

      expect(service.findOne).toHaveBeenCalledWith(bookingId);
      expect(repository.save).toHaveBeenCalled();
      expect(result.startTime).toEqual(newStartTime);
      expect(result.rescheduleCount).toBe(1);
    });
  });
});
