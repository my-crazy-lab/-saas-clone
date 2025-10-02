import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from '../entities/meeting-type.entity';
import { CreateAvailabilityWindowDto } from './create-availability-window.dto';

export class CreateMeetingTypeDto {
  @ApiProperty({ example: 'Intro Call' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'intro-call' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'A brief introduction call to discuss your needs', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferBefore?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferAfter?: number;

  @ApiProperty({ enum: LocationType, example: LocationType.GOOGLE_MEET })
  @IsEnum(LocationType)
  locationType: LocationType;

  @ApiProperty({ example: 'Conference Room A', required: false })
  @IsOptional()
  @IsString()
  locationDetails?: string;

  @ApiProperty({ example: '#3B82F6', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 24, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(8760)
  minimumNotice?: number;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  maximumNotice?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxBookingsPerDay?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  requireConfirmation?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  collectPhoneNumber?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  collectNotes?: boolean;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customFields?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  sendConfirmationEmail?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  sendReminderEmail?: boolean;

  @ApiProperty({ type: [Number], example: [24, 1], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminderTimes?: number[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  sendSmsReminders?: boolean;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ type: [CreateAvailabilityWindowDto], required: false })
  @IsOptional()
  @IsArray()
  availabilityWindows?: CreateAvailabilityWindowDto[];
}
