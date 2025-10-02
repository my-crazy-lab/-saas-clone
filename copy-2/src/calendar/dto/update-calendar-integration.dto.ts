import { PartialType } from '@nestjs/swagger';
import { CreateCalendarIntegrationDto } from './create-calendar-integration.dto';

export class UpdateCalendarIntegrationDto extends PartialType(CreateCalendarIntegrationDto) {}
