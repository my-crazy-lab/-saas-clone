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
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { GoogleCalendarService } from './services/google-calendar.service';
import { MicrosoftCalendarService } from './services/microsoft-calendar.service';
import { CreateCalendarIntegrationDto } from './dto/create-calendar-integration.dto';
import { UpdateCalendarIntegrationDto } from './dto/update-calendar-integration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarProvider } from './entities/calendar-integration.entity';

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly microsoftCalendarService: MicrosoftCalendarService,
  ) {}

  @Get('auth/google')
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL' })
  getGoogleAuthUrl(@Request() req, @Query('state') state?: string) {
    const authUrl = this.googleCalendarService.getAuthUrl(state || req.user.id);
    return { authUrl };
  }

  @Get('auth/microsoft')
  @ApiOperation({ summary: 'Get Microsoft Calendar OAuth URL' })
  getMicrosoftAuthUrl(@Request() req, @Query('state') state?: string) {
    const authUrl = this.microsoftCalendarService.getAuthUrl(state || req.user.id);
    return { authUrl };
  }

  @Post('auth/google/callback')
  @ApiOperation({ summary: 'Handle Google Calendar OAuth callback' })
  async handleGoogleCallback(
    @Request() req,
    @Body('code') code: string,
    @Body('state') state?: string,
  ) {
    const tokens = await this.googleCalendarService.exchangeCodeForTokens(code);
    const userInfo = await this.googleCalendarService.getUserInfo(tokens.access_token);

    const integrationDto: CreateCalendarIntegrationDto = {
      provider: CalendarProvider.GOOGLE,
      providerAccountId: userInfo.id,
      providerAccountEmail: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };

    const integration = await this.calendarService.createIntegration(
      state || req.user.id,
      integrationDto,
    );

    return integration;
  }

  @Post('auth/microsoft/callback')
  @ApiOperation({ summary: 'Handle Microsoft Calendar OAuth callback' })
  async handleMicrosoftCallback(
    @Request() req,
    @Body('code') code: string,
    @Body('state') state?: string,
  ) {
    const tokens = await this.microsoftCalendarService.exchangeCodeForTokens(code);
    const userInfo = await this.microsoftCalendarService.getUserInfo(tokens.access_token);

    const integrationDto: CreateCalendarIntegrationDto = {
      provider: CalendarProvider.MICROSOFT,
      providerAccountId: userInfo.id,
      providerAccountEmail: userInfo.mail || userInfo.userPrincipalName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };

    const integration = await this.calendarService.createIntegration(
      state || req.user.id,
      integrationDto,
    );

    return integration;
  }

  @Get('integrations')
  @ApiOperation({ summary: 'Get user calendar integrations' })
  findUserIntegrations(@Request() req) {
    return this.calendarService.findUserIntegrations(req.user.id);
  }

  @Get('integrations/:id')
  @ApiOperation({ summary: 'Get calendar integration by ID' })
  findIntegration(@Param('id') id: string) {
    return this.calendarService.findIntegration(id);
  }

  @Patch('integrations/:id')
  @ApiOperation({ summary: 'Update calendar integration' })
  updateIntegration(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalendarIntegrationDto,
  ) {
    return this.calendarService.updateIntegration(id, updateDto);
  }

  @Delete('integrations/:id')
  @ApiOperation({ summary: 'Delete calendar integration' })
  deleteIntegration(@Param('id') id: string) {
    return this.calendarService.deleteIntegration(id);
  }

  @Post('integrations/:id/refresh')
  @ApiOperation({ summary: 'Refresh calendar integration token' })
  refreshToken(@Param('id') id: string) {
    return this.calendarService.refreshToken(id);
  }

  @Get('integrations/:id/freebusy')
  @ApiOperation({ summary: 'Get free/busy information' })
  getFreeBusyInfo(
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return this.calendarService.getFreeBusyInfo(id, startTime, endTime);
  }
}
