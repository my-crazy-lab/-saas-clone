import { IsEnum, IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CalendarProvider } from '../entities/calendar-integration.entity';

export class CreateCalendarIntegrationDto {
  @ApiProperty({ enum: CalendarProvider })
  @IsEnum(CalendarProvider)
  provider: CalendarProvider;

  @ApiProperty()
  @IsString()
  providerAccountId: string;

  @ApiProperty()
  @IsString()
  providerAccountEmail: string;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  tokenExpiresAt?: Date;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  createEvents?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  readBusyTime?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  primaryCalendarId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCalendarIds?: string[];
}
