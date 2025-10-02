import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MeetingType } from '../../meeting-types/entities/meeting-type.entity';

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

@Entity('bookings')
@Index(['hostId', 'startTime'])
@Index(['guestEmail'])
@Index(['status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  hostId: string;

  @Column('uuid')
  meetingTypeId: string;

  // Guest information
  @Column()
  guestName: string;

  @Column()
  guestEmail: string;

  @Column({ nullable: true })
  guestPhone: string;

  @Column({ nullable: true })
  guestNotes: string;

  @Column({ nullable: true })
  guestTimezone: string;

  // Booking details
  @Column('timestamp with time zone')
  startTime: Date;

  @Column('timestamp with time zone')
  endTime: Date;

  @Column()
  duration: number; // in minutes

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  // Meeting details
  @Column({ nullable: true })
  meetingUrl: string;

  @Column({ nullable: true })
  meetingId: string;

  @Column({ nullable: true })
  meetingPassword: string;

  @Column({ nullable: true })
  dialInNumber: string;

  // Calendar integration
  @Column({ nullable: true })
  googleEventId: string;

  @Column({ nullable: true })
  microsoftEventId: string;

  // Tokens for guest actions
  @Column({ unique: true })
  rescheduleToken: string;

  @Column({ unique: true })
  cancelToken: string;

  // Notifications
  @Column({ default: false })
  confirmationEmailSent: boolean;

  @Column({ default: false })
  reminderEmailSent: boolean;

  @Column({ default: false })
  reminderSmsSent: boolean;

  @Column('timestamp with time zone', { array: true, default: [] })
  remindersSentAt: Date[];

  // Cancellation details
  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string; // 'host' or 'guest'

  @Column({ nullable: true })
  cancellationReason: string;

  // Rescheduling history
  @Column({ nullable: true })
  originalStartTime: Date;

  @Column({ default: 0 })
  rescheduleCount: number;

  @Column({ nullable: true })
  lastRescheduledAt: Date;

  // Payment (Pro feature)
  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.hostedBookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hostId' })
  host: User;

  @ManyToOne(() => MeetingType, (meetingType) => meetingType.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetingTypeId' })
  meetingType: MeetingType;

  // Helper methods
  get isUpcoming(): boolean {
    return this.startTime > new Date() && this.status === BookingStatus.CONFIRMED;
  }

  get isPast(): boolean {
    return this.endTime < new Date();
  }

  get canReschedule(): boolean {
    return this.status === BookingStatus.CONFIRMED && this.isUpcoming;
  }

  get canCancel(): boolean {
    return this.status === BookingStatus.CONFIRMED && this.isUpcoming;
  }
}
