import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

export interface CreateBookingDto {
  meetingTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNotes?: string;
  guestTimezone?: string;
  startTime: Date;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly meetingTypesService: MeetingTypesService,
    private readonly calendarService: CalendarService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const meetingType = await this.meetingTypesService.findOne(createBookingDto.meetingTypeId);
    
    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    // Calculate end time
    const endTime = new Date(createBookingDto.startTime);
    endTime.setMinutes(endTime.getMinutes() + meetingType.duration);

    // Check for conflicts (simplified - in production, check against calendar)
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        hostId: meetingType.userId,
        startTime: createBookingDto.startTime,
        status: BookingStatus.CONFIRMED,
      },
    });

    if (existingBooking) {
      throw new BadRequestException('Time slot is already booked');
    }

    // Generate tokens for guest actions
    const rescheduleToken = crypto.randomBytes(32).toString('hex');
    const cancelToken = crypto.randomBytes(32).toString('hex');

    // Create booking
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      hostId: meetingType.userId,
      endTime,
      duration: meetingType.duration,
      rescheduleToken,
      cancelToken,
      status: BookingStatus.CONFIRMED,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // TODO: Create calendar event
    // TODO: Generate meeting URL (Google Meet/Zoom)

    // Send confirmation email
    await this.notificationsService.sendBookingConfirmation(
      createBookingDto.guestEmail,
      {
        ...savedBooking,
        meetingType,
      },
      savedBooking.id,
    );

    return this.findOne(savedBooking.id);
  }

  async findAll(hostId?: string): Promise<Booking[]> {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.meetingType', 'meetingType')
      .leftJoinAndSelect('booking.host', 'host');

    if (hostId) {
      query.where('booking.hostId = :hostId', { hostId });
    }

    return query.orderBy('booking.startTime', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['meetingType', 'host'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByToken(token: string, tokenType: 'reschedule' | 'cancel'): Promise<Booking> {
    const whereClause = tokenType === 'reschedule' 
      ? { rescheduleToken: token }
      : { cancelToken: token };

    const booking = await this.bookingRepository.findOne({
      where: whereClause,
      relations: ['meetingType', 'host'],
    });

    if (!booking) {
      throw new NotFoundException('Invalid token');
    }

    return booking;
  }

  async cancel(id: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

    // TODO: Delete calendar event
    // TODO: Send cancellation notification

    return this.bookingRepository.save(booking);
  }

  async reschedule(id: string, newStartTime: Date): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking cannot be rescheduled');
    }

    // Store original time
    if (!booking.originalStartTime) {
      booking.originalStartTime = booking.startTime;
    }

    // Update times
    booking.startTime = newStartTime;
    booking.endTime = new Date(newStartTime.getTime() + booking.duration * 60000);
    booking.rescheduleCount += 1;
    booking.lastRescheduledAt = new Date();

    // TODO: Update calendar event
    // TODO: Send reschedule notification

    return this.bookingRepository.save(booking);
  }

  async getUpcomingBookings(hostId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        hostId,
        status: BookingStatus.CONFIRMED,
      },
      relations: ['meetingType'],
      order: { startTime: 'ASC' },
    });
  }
}
