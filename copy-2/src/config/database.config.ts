import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { CalendarIntegration } from '../calendar/entities/calendar-integration.entity';
import { MeetingType } from '../meeting-types/entities/meeting-type.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AvailabilityWindow } from '../meeting-types/entities/availability-window.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  entities: [
    User,
    CalendarIntegration,
    MeetingType,
    AvailabilityWindow,
    Booking,
    Notification,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

// DataSource for migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    CalendarIntegration,
    MeetingType,
    AvailabilityWindow,
    Booking,
    Notification,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
