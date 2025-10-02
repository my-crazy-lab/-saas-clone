import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { GoogleCalendarService } from './services/google-calendar.service';
import { MicrosoftCalendarService } from './services/microsoft-calendar.service';
import { CalendarIntegration } from './entities/calendar-integration.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarIntegration]),
    UsersModule,
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    GoogleCalendarService,
    MicrosoftCalendarService,
  ],
  exports: [CalendarService, GoogleCalendarService, MicrosoftCalendarService],
})
export class CalendarModule {}
