import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingTypesService } from './meeting-types.service';
import { MeetingTypesController } from './meeting-types.controller';
import { MeetingType } from './entities/meeting-type.entity';
import { AvailabilityWindow } from './entities/availability-window.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingType, AvailabilityWindow]),
    UsersModule,
  ],
  controllers: [MeetingTypesController],
  providers: [MeetingTypesService],
  exports: [MeetingTypesService],
})
export class MeetingTypesModule {}
