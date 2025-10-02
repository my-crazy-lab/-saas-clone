import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingTypesService } from './meeting-types.service';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { UpdateMeetingTypeDto } from './dto/update-meeting-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeetingType } from './entities/meeting-type.entity';

@ApiTags('meeting-types')
@Controller('meeting-types')
export class MeetingTypesController {
  constructor(private readonly meetingTypesService: MeetingTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new meeting type' })
  @ApiResponse({ status: 201, description: 'Meeting type created successfully', type: MeetingType })
  create(@Request() req, @Body() createDto: CreateMeetingTypeDto) {
    return this.meetingTypesService.create(req.user.id, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user meeting types' })
  @ApiResponse({ status: 200, description: 'Meeting types retrieved successfully', type: [MeetingType] })
  findAll(@Request() req) {
    return this.meetingTypesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting type by ID' })
  @ApiResponse({ status: 200, description: 'Meeting type retrieved successfully', type: MeetingType })
  @ApiResponse({ status: 404, description: 'Meeting type not found' })
  findOne(@Param('id') id: string) {
    return this.meetingTypesService.findOne(id);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available time slots for a meeting type' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved successfully' })
  getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('timezone') timezone?: string,
  ) {
    const targetDate = new Date(date);
    return this.meetingTypesService.getAvailableSlots(id, targetDate, timezone);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update meeting type' })
  @ApiResponse({ status: 200, description: 'Meeting type updated successfully', type: MeetingType })
  @ApiResponse({ status: 404, description: 'Meeting type not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateMeetingTypeDto,
  ) {
    return this.meetingTypesService.update(id, req.user.id, updateDto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle meeting type status (active/inactive)' })
  @ApiResponse({ status: 200, description: 'Meeting type status updated successfully', type: MeetingType })
  toggleStatus(@Param('id') id: string, @Request() req) {
    return this.meetingTypesService.toggleStatus(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete meeting type' })
  @ApiResponse({ status: 200, description: 'Meeting type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meeting type not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.meetingTypesService.remove(id, req.user.id);
  }
}
