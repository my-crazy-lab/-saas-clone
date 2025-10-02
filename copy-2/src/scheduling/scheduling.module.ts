import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { UsersModule } from '../users/users.module';
import { MeetingTypesModule } from '../meeting-types/meeting-types.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [
    UsersModule,
    MeetingTypesModule,
    BookingsModule,
    CalendarModule,
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
