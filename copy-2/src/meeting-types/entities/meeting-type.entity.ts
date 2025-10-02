import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AvailabilityWindow } from './availability-window.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum MeetingTypeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum LocationType {
  GOOGLE_MEET = 'google_meet',
  ZOOM = 'zoom',
  MICROSOFT_TEAMS = 'microsoft_teams',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
  CUSTOM = 'custom',
}

@Entity('meeting_types')
@Index(['userId', 'slug'], { unique: true })
export class MeetingType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  duration: number; // in minutes

  @Column({ default: 0 })
  bufferBefore: number; // in minutes

  @Column({ default: 0 })
  bufferAfter: number; // in minutes

  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.GOOGLE_MEET,
  })
  locationType: LocationType;

  @Column({ nullable: true })
  locationDetails: string;

  @Column({ default: '#3B82F6' })
  color: string;

  @Column({ default: 24 })
  minimumNotice: number; // in hours

  @Column({ default: 60 })
  maximumNotice: number; // in days

  @Column({ nullable: true })
  maxBookingsPerDay: number;

  @Column({ default: true })
  requireConfirmation: boolean;

  @Column({ default: false })
  collectPhoneNumber: boolean;

  @Column({ default: false })
  collectNotes: boolean;

  @Column('text', { array: true, default: [] })
  customFields: string[];

  @Column({
    type: 'enum',
    enum: MeetingTypeStatus,
    default: MeetingTypeStatus.ACTIVE,
  })
  status: MeetingTypeStatus;

  // Notification settings
  @Column({ default: true })
  sendConfirmationEmail: boolean;

  @Column({ default: true })
  sendReminderEmail: boolean;

  @Column('int', { array: true, default: [24, 1] }) // hours before
  reminderTimes: number[];

  @Column({ default: false })
  sendSmsReminders: boolean;

  // Pricing (Pro feature)
  @Column({ nullable: true })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.meetingTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => AvailabilityWindow, (window) => window.meetingType, {
    cascade: true,
  })
  availabilityWindows: AvailabilityWindow[];

  @OneToMany(() => Booking, (booking) => booking.meetingType)
  bookings: Booking[];

  // Virtual properties
  get publicUrl(): string {
    return `/schedule/${this.user?.username}/${this.slug}`;
  }

  get durationWithBuffer(): number {
    return this.duration + this.bufferBefore + this.bufferAfter;
  }
}
