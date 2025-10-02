import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification, NotificationType, NotificationTemplate, NotificationStatus } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async createNotification(data: {
    type: NotificationType;
    template: NotificationTemplate;
    recipientEmail: string;
    recipientPhone?: string;
    subject: string;
    content: string;
    templateData?: Record<string, any>;
    scheduledFor?: Date;
    userId?: string;
    bookingId?: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    const savedNotification = await this.notificationRepository.save(notification);

    // Queue the notification for processing
    await this.notificationQueue.add(
      'send-notification',
      { notificationId: savedNotification.id },
      {
        delay: data.scheduledFor ? data.scheduledFor.getTime() - Date.now() : 0,
      },
    );

    return savedNotification;
  }

  async sendBookingConfirmation(
    recipientEmail: string,
    bookingData: any,
    bookingId: string,
  ): Promise<void> {
    await this.createNotification({
      type: NotificationType.EMAIL,
      template: NotificationTemplate.BOOKING_CONFIRMATION,
      recipientEmail,
      subject: `Booking Confirmed: ${bookingData.meetingType.title}`,
      content: `Your booking for ${bookingData.meetingType.title} has been confirmed.`,
      templateData: bookingData,
      bookingId,
    });
  }

  async sendBookingReminder(
    recipientEmail: string,
    recipientPhone: string | undefined,
    bookingData: any,
    bookingId: string,
    reminderTime: Date,
  ): Promise<void> {
    // Email reminder
    await this.createNotification({
      type: NotificationType.EMAIL,
      template: NotificationTemplate.BOOKING_REMINDER,
      recipientEmail,
      subject: `Reminder: ${bookingData.meetingType.title} in 1 hour`,
      content: `This is a reminder that you have a meeting scheduled.`,
      templateData: bookingData,
      scheduledFor: reminderTime,
      bookingId,
    });

    // SMS reminder (if phone number provided and SMS enabled)
    if (recipientPhone && bookingData.sendSmsReminders) {
      await this.createNotification({
        type: NotificationType.SMS,
        template: NotificationTemplate.BOOKING_REMINDER,
        recipientEmail,
        recipientPhone,
        subject: 'Meeting Reminder',
        content: `Reminder: You have a meeting in 1 hour.`,
        templateData: bookingData,
        scheduledFor: reminderTime,
        bookingId,
      });
    }
  }

  async findNotification(id: string): Promise<Notification> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.FAILED) {
      updateData.failedAt = new Date();
      updateData.errorMessage = errorMessage;
    }

    await this.notificationRepository.update(id, updateData);
  }
}
