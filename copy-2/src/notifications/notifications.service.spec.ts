import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType, NotificationTemplate, NotificationStatus } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<Notification>;
  let notificationQueue: Queue;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    notificationQueue = module.get<Queue>(getQueueToken('notifications'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendBookingConfirmation', () => {
    const recipientEmail = 'john@example.com';
    const bookingData = {
      id: 'booking-1',
      guestName: 'John Doe',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:30:00Z'),
      duration: 30,
      meetingType: {
        title: '30-minute Consultation',
        description: 'Quick consultation call',
      },
      host: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      },
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      rescheduleToken: 'reschedule-token-123',
      cancelToken: 'cancel-token-123',
    };
    const bookingId = 'booking-1';

    it('should create and queue booking confirmation email', async () => {
      const expectedNotification = {
        id: 'notification-1',
        type: NotificationType.EMAIL,
        template: NotificationTemplate.BOOKING_CONFIRMATION,
        recipientEmail,
        subject: 'Booking Confirmed: 30-minute Consultation',
        content: expect.stringContaining('Your booking has been confirmed'),
        bookingId,
        status: NotificationStatus.PENDING,
      };

      mockRepository.create.mockReturnValue(expectedNotification);
      mockRepository.save.mockResolvedValue(expectedNotification);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.sendBookingConfirmation(recipientEmail, bookingData, bookingId);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.EMAIL,
          template: NotificationTemplate.BOOKING_CONFIRMATION,
          recipientEmail,
          bookingId,
          status: NotificationStatus.PENDING,
        })
      );
      expect(repository.save).toHaveBeenCalled();
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-notification',
        { notificationId: expectedNotification.id }
      );
    });

    it('should generate correct email content', async () => {
      const expectedNotification = {
        id: 'notification-1',
        content: expect.stringContaining('30-minute Consultation'),
      };

      mockRepository.create.mockReturnValue(expectedNotification);
      mockRepository.save.mockResolvedValue(expectedNotification);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.sendBookingConfirmation(recipientEmail, bookingData, bookingId);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.content).toContain('30-minute Consultation');
      expect(createCall.content).toContain('John Doe');
      expect(createCall.content).toContain('Jane Smith');
      expect(createCall.content).toContain('https://meet.google.com/abc-defg-hij');
    });
  });

  describe('sendBookingReminder', () => {
    const recipientEmail = 'john@example.com';
    const bookingData = {
      id: 'booking-1',
      guestName: 'John Doe',
      startTime: new Date('2024-01-15T10:00:00Z'),
      meetingType: {
        title: '30-minute Consultation',
      },
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    };
    const bookingId = 'booking-1';
    const reminderTime = new Date('2024-01-15T09:00:00Z'); // 1 hour before

    it('should create and schedule booking reminder email', async () => {
      const expectedNotification = {
        id: 'notification-1',
        type: NotificationType.EMAIL,
        template: NotificationTemplate.BOOKING_REMINDER,
        recipientEmail,
        subject: 'Reminder: 30-minute Consultation starting soon',
        bookingId,
        scheduledFor: reminderTime,
        status: NotificationStatus.PENDING,
      };

      mockRepository.create.mockReturnValue(expectedNotification);
      mockRepository.save.mockResolvedValue(expectedNotification);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.sendBookingReminder(recipientEmail, bookingData, bookingId);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.EMAIL,
          template: NotificationTemplate.BOOKING_REMINDER,
          scheduledFor: reminderTime,
          status: NotificationStatus.PENDING,
        })
      );
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-notification',
        { notificationId: expectedNotification.id },
        { delay: expect.any(Number) }
      );
    });

    it('should calculate correct delay for scheduled notification', async () => {
      const now = new Date('2024-01-15T08:00:00Z');
      const scheduledFor = new Date('2024-01-15T09:00:00Z');
      const expectedDelay = scheduledFor.getTime() - now.getTime(); // 1 hour = 3600000ms

      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      mockRepository.create.mockReturnValue({ id: 'notification-1' });
      mockRepository.save.mockResolvedValue({ id: 'notification-1' });
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.sendBookingReminder(recipientEmail, bookingData, bookingId);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-notification',
        { notificationId: 'notification-1' },
        { delay: expectedDelay }
      );

      jest.restoreAllMocks();
    });
  });

  // SMS functionality is optional and not implemented in the basic service
  // This test would be added when SMS service is fully implemented

  describe('findNotification', () => {
    it('should return notification by id', async () => {
      const notificationId = 'notification-1';
      const expectedNotification = {
        id: notificationId,
        type: NotificationType.EMAIL,
        recipientEmail: 'john@example.com',
        status: NotificationStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(expectedNotification);

      const result = await service.findNotification(notificationId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result).toEqual(expectedNotification);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status', async () => {
      const notificationId = 'notification-1';
      const status = NotificationStatus.SENT;
      const providerResponse = 'Email sent successfully';

      await service.updateNotificationStatus(notificationId, status, providerResponse);

      expect(repository.update).toHaveBeenCalledWith(notificationId, {
        status,
        providerResponse,
        sentAt: expect.any(Date),
      });
    });

    it('should update notification status without provider response', async () => {
      const notificationId = 'notification-1';
      const status = NotificationStatus.FAILED;

      await service.updateNotificationStatus(notificationId, status);

      expect(repository.update).toHaveBeenCalledWith(notificationId, {
        status,
        providerResponse: undefined,
        sentAt: expect.any(Date),
      });
    });
  });
});
