import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationTemplate {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_RESCHEDULED = 'booking_rescheduled',
  CALENDAR_INVITE = 'calendar_invite',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

@Entity('notifications')
@Index(['recipientEmail'])
@Index(['status'])
@Index(['scheduledFor'])
@Index(['bookingId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationTemplate,
  })
  template: NotificationTemplate;

  @Column()
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  templateData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  // Related entities
  @Column('uuid', { nullable: true })
  userId: string;

  @Column('uuid', { nullable: true })
  bookingId: string;

  // Provider-specific data
  @Column({ nullable: true })
  providerMessageId: string;

  @Column('jsonb', { nullable: true })
  providerResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  get canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  get isScheduled(): boolean {
    return this.scheduledFor && this.scheduledFor > new Date();
  }

  get isDue(): boolean {
    return this.scheduledFor && this.scheduledFor <= new Date() && this.status === NotificationStatus.PENDING;
  }
}
