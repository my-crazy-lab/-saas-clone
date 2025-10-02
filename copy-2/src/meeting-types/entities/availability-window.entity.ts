import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MeetingType } from './meeting-type.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('availability_windows')
export class AvailabilityWindow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  meetingTypeId: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column('time')
  startTime: string; // Format: HH:MM

  @Column('time')
  endTime: string; // Format: HH:MM

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MeetingType, (meetingType) => meetingType.availabilityWindows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetingTypeId' })
  meetingType: MeetingType;

  // Helper methods
  get startTimeMinutes(): number {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    return hours * 60 + minutes;
  }

  get endTimeMinutes(): number {
    const [hours, minutes] = this.endTime.split(':').map(Number);
    return hours * 60 + minutes;
  }

  get durationMinutes(): number {
    return this.endTimeMinutes - this.startTimeMinutes;
  }
}
