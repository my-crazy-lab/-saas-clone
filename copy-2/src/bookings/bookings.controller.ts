import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService, CreateBookingDto } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (public endpoint)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: Booking })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully', type: [Booking] })
  findAll(@Request() req) {
    return this.bookingsService.findAll(req.user.id);
  }

  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming bookings' })
  @ApiResponse({ status: 200, description: 'Upcoming bookings retrieved successfully', type: [Booking] })
  getUpcoming(@Request() req) {
    return this.bookingsService.getUpcomingBookings(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking (public endpoint with token)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully', type: Booking })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, reason);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule booking (public endpoint with token)' })
  @ApiResponse({ status: 200, description: 'Booking rescheduled successfully', type: Booking })
  reschedule(
    @Param('id') id: string,
    @Body('newStartTime') newStartTime: string,
  ) {
    return this.bookingsService.reschedule(id, new Date(newStartTime));
  }
}
