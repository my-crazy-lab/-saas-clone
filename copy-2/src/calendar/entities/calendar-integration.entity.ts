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
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

export enum CalendarProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  OUTLOOK = 'outlook',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  EXPIRED = 'expired',
}

@Entity('calendar_integrations')
@Index(['userId', 'provider'], { unique: true })
export class CalendarIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: CalendarProvider,
  })
  provider: CalendarProvider;

  @Column()
  providerAccountId: string;

  @Column()
  providerAccountEmail: string;

  @Column()
  @Exclude()
  accessToken: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  tokenExpiresAt: Date;

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.ACTIVE,
  })
  status: IntegrationStatus;

  @Column({ default: true })
  syncEnabled: boolean;

  @Column({ default: true })
  createEvents: boolean;

  @Column({ default: true })
  readBusyTime: boolean;

  // Calendar-specific settings
  @Column({ nullable: true })
  primaryCalendarId: string;

  @Column('text', { array: true, default: [] })
  selectedCalendarIds: string[];

  // Sync metadata
  @Column({ nullable: true })
  lastSyncAt: Date;

  @Column({ nullable: true })
  syncToken: string;

  @Column({ nullable: true })
  lastError: string;

  @Column({ nullable: true })
  lastErrorAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.calendarIntegrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Helper methods
  get isExpired(): boolean {
    return this.tokenExpiresAt && new Date() > this.tokenExpiresAt;
  }

  get needsRefresh(): boolean {
    return this.isExpired && !!this.refreshToken;
  }
}
