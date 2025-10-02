import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarIntegration, CalendarProvider, IntegrationStatus } from './entities/calendar-integration.entity';
import { GoogleCalendarService } from './services/google-calendar.service';
import { MicrosoftCalendarService } from './services/microsoft-calendar.service';
import { CreateCalendarIntegrationDto } from './dto/create-calendar-integration.dto';
import { UpdateCalendarIntegrationDto } from './dto/update-calendar-integration.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarIntegration)
    private readonly calendarIntegrationRepository: Repository<CalendarIntegration>,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly microsoftCalendarService: MicrosoftCalendarService,
  ) {}

  async createIntegration(
    userId: string,
    createDto: CreateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    // Check if integration already exists
    const existingIntegration = await this.calendarIntegrationRepository.findOne({
      where: {
        userId,
        provider: createDto.provider,
      },
    });

    if (existingIntegration) {
      throw new BadRequestException('Integration with this provider already exists');
    }

    const integration = this.calendarIntegrationRepository.create({
      userId,
      ...createDto,
    });

    return this.calendarIntegrationRepository.save(integration);
  }

  async findUserIntegrations(userId: string): Promise<CalendarIntegration[]> {
    return this.calendarIntegrationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findIntegration(id: string): Promise<CalendarIntegration> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    return integration;
  }

  async updateIntegration(
    id: string,
    updateDto: UpdateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    const integration = await this.findIntegration(id);
    Object.assign(integration, updateDto);
    return this.calendarIntegrationRepository.save(integration);
  }

  async deleteIntegration(id: string): Promise<void> {
    const integration = await this.findIntegration(id);
    await this.calendarIntegrationRepository.remove(integration);
  }

  async refreshToken(integrationId: string): Promise<CalendarIntegration> {
    const integration = await this.findIntegration(integrationId);

    if (!integration.refreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    try {
      let newTokens: any;

      switch (integration.provider) {
        case CalendarProvider.GOOGLE:
          newTokens = await this.googleCalendarService.refreshAccessToken(
            integration.refreshToken,
          );
          break;
        case CalendarProvider.MICROSOFT:
          newTokens = await this.microsoftCalendarService.refreshAccessToken(
            integration.refreshToken,
          );
          break;
        default:
          throw new BadRequestException('Unsupported provider');
      }

      integration.accessToken = newTokens.access_token;
      integration.tokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      integration.status = IntegrationStatus.ACTIVE;
      integration.lastError = null;
      integration.lastErrorAt = null;

      return this.calendarIntegrationRepository.save(integration);
    } catch (error) {
      integration.status = IntegrationStatus.ERROR;
      integration.lastError = error.message;
      integration.lastErrorAt = new Date();
      await this.calendarIntegrationRepository.save(integration);
      throw error;
    }
  }

  async getFreeBusyInfo(
    integrationId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    const integration = await this.findIntegration(integrationId);

    if (integration.needsRefresh) {
      await this.refreshToken(integrationId);
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        return this.googleCalendarService.getFreeBusyInfo(
          integration.accessToken,
          integration.selectedCalendarIds,
          startTime,
          endTime,
        );
      case CalendarProvider.MICROSOFT:
        return this.microsoftCalendarService.getFreeBusyInfo(
          integration.accessToken,
          startTime,
          endTime,
        );
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  async createEvent(
    integrationId: string,
    eventData: any,
  ): Promise<any> {
    const integration = await this.findIntegration(integrationId);

    if (integration.needsRefresh) {
      await this.refreshToken(integrationId);
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        return this.googleCalendarService.createEvent(
          integration.accessToken,
          integration.primaryCalendarId || 'primary',
          eventData,
        );
      case CalendarProvider.MICROSOFT:
        return this.microsoftCalendarService.createEvent(
          integration.accessToken,
          eventData,
        );
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  async updateEvent(
    integrationId: string,
    eventId: string,
    eventData: any,
  ): Promise<any> {
    const integration = await this.findIntegration(integrationId);

    if (integration.needsRefresh) {
      await this.refreshToken(integrationId);
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        return this.googleCalendarService.updateEvent(
          integration.accessToken,
          integration.primaryCalendarId || 'primary',
          eventId,
          eventData,
        );
      case CalendarProvider.MICROSOFT:
        return this.microsoftCalendarService.updateEvent(
          integration.accessToken,
          eventId,
          eventData,
        );
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  async deleteEvent(integrationId: string, eventId: string): Promise<void> {
    const integration = await this.findIntegration(integrationId);

    if (integration.needsRefresh) {
      await this.refreshToken(integrationId);
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        await this.googleCalendarService.deleteEvent(
          integration.accessToken,
          integration.primaryCalendarId || 'primary',
          eventId,
        );
        break;
      case CalendarProvider.MICROSOFT:
        await this.microsoftCalendarService.deleteEvent(
          integration.accessToken,
          eventId,
        );
        break;
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }
}
