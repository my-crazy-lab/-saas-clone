import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';
import { NotificationType, NotificationStatus } from '../entities/notification.entity';

@Processor('notifications')
export class NotificationProcessor {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<{ notificationId: string }>) {
    const { notificationId } = job.data;
    
    try {
      const notification = await this.notificationsService.findNotification(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.type === NotificationType.EMAIL) {
        await this.emailService.sendEmail(
          notification.recipientEmail,
          notification.subject,
          notification.content,
        );
      } else if (notification.type === NotificationType.SMS) {
        if (!notification.recipientPhone) {
          throw new Error('Phone number required for SMS notification');
        }
        await this.smsService.sendSms(
          notification.recipientPhone,
          notification.content,
        );
      }

      await this.notificationsService.updateNotificationStatus(
        notificationId,
        NotificationStatus.SENT,
      );
    } catch (error) {
      await this.notificationsService.updateNotificationStatus(
        notificationId,
        NotificationStatus.FAILED,
        error.message,
      );
      
      // Retry logic could be implemented here
      throw error;
    }
  }
}
