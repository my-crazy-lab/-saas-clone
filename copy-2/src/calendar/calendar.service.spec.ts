import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarService } from './calendar.service';
import { CalendarIntegration, CalendarProvider, IntegrationStatus } from './entities/calendar-integration.entity';
import { GoogleCalendarService } from './services/google-calendar.service';
import { MicrosoftCalendarService } from './services/microsoft-calendar.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let repository: Repository<CalendarIntegration>;
  let googleCalendarService: GoogleCalendarService;
  let microsoftCalendarService: MicrosoftCalendarService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockGoogleCalendarService = {
    getAuthUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    getFreeBusyInfo: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  const mockMicrosoftCalendarService = {
    getAuthUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    getFreeBusyInfo: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getRepositoryToken(CalendarIntegration),
          useValue: mockRepository,
        },
        {
          provide: GoogleCalendarService,
          useValue: mockGoogleCalendarService,
        },
        {
          provide: MicrosoftCalendarService,
          useValue: mockMicrosoftCalendarService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    repository = module.get<Repository<CalendarIntegration>>(getRepositoryToken(CalendarIntegration));
    googleCalendarService = module.get<GoogleCalendarService>(GoogleCalendarService);
    microsoftCalendarService = module.get<MicrosoftCalendarService>(MicrosoftCalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should return Google OAuth URL', async () => {
      const userId = 'user-1';
      const provider = 'google';
      const expectedUrl = 'https://accounts.google.com/oauth/authorize?...';

      mockGoogleCalendarService.getAuthUrl.mockReturnValue(expectedUrl);

      const result = await service.getAuthUrl(provider, userId);

      expect(googleCalendarService.getAuthUrl).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedUrl);
    });
  });

  describe('handleCallback', () => {
    it('should handle Google OAuth callback successfully', async () => {
      const userId = 'user-1';
      const code = 'auth-code-123';
      const provider = 'google';

      const tokenData = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      const expectedIntegration = {
        id: 'integration-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        status: IntegrationStatus.ACTIVE,
      };

      mockGoogleCalendarService.exchangeCodeForTokens.mockResolvedValue(tokenData);
      mockRepository.findOne.mockResolvedValue(null); // No existing integration
      mockRepository.create.mockReturnValue(expectedIntegration);
      mockRepository.save.mockResolvedValue(expectedIntegration);

      const result = await service.handleCallback(provider, code, userId);

      expect(googleCalendarService.exchangeCodeForTokens).toHaveBeenCalledWith(code);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId, provider: CalendarProvider.GOOGLE },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedIntegration);
    });

    it('should update existing Google integration', async () => {
      const userId = 'user-1';
      const code = 'auth-code-123';
      const provider = 'google';

      const tokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      const existingIntegration = {
        id: 'integration-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        status: IntegrationStatus.EXPIRED,
      };

      const updatedIntegration = {
        ...existingIntegration,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        status: IntegrationStatus.ACTIVE,
      };

      mockGoogleCalendarService.exchangeCodeForTokens.mockResolvedValue(tokenData);
      mockRepository.findOne.mockResolvedValue(existingIntegration);
      mockRepository.save.mockResolvedValue(updatedIntegration);

      const result = await service.handleCallback(provider, code, userId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          status: IntegrationStatus.ACTIVE,
        })
      );
      expect(result).toEqual(updatedIntegration);
    });
  });

  describe('getFreeBusyInfo', () => {
    const userId = 'user-1';
    const startTime = new Date('2024-01-15T09:00:00Z');
    const endTime = new Date('2024-01-15T17:00:00Z');

    it('should get free/busy info from Google Calendar', async () => {
      const integration = {
        id: 'integration-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        status: IntegrationStatus.ACTIVE,
        isExpired: jest.fn().mockReturnValue(false),
      };

      const expectedFreeBusy = {
        busy: [
          {
            start: new Date('2024-01-15T10:00:00Z'),
            end: new Date('2024-01-15T11:00:00Z'),
          },
          {
            start: new Date('2024-01-15T14:00:00Z'),
            end: new Date('2024-01-15T15:00:00Z'),
          },
        ],
      };

      mockRepository.find.mockResolvedValue([integration]);
      mockGoogleCalendarService.getFreeBusyInfo.mockResolvedValue(expectedFreeBusy);

      const result = await service.getFreeBusyInfo(userId, startTime, endTime);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, status: IntegrationStatus.ACTIVE },
      });
      expect(googleCalendarService.getFreeBusyInfo).toHaveBeenCalledWith(
        integration.accessToken,
        startTime,
        endTime
      );
      expect(result).toEqual([expectedFreeBusy]);
    });

    it('should refresh expired tokens before getting free/busy info', async () => {
      const integration = {
        id: 'integration-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: 'expired-access-token',
        refreshToken: 'refresh-token',
        status: IntegrationStatus.ACTIVE,
        isExpired: jest.fn().mockReturnValue(true),
      };

      const newTokenData = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      const expectedFreeBusy = {
        busy: [],
      };

      mockRepository.find.mockResolvedValue([integration]);
      mockGoogleCalendarService.refreshAccessToken.mockResolvedValue(newTokenData);
      mockRepository.save.mockResolvedValue({
        ...integration,
        accessToken: newTokenData.access_token,
      });
      mockGoogleCalendarService.getFreeBusyInfo.mockResolvedValue(expectedFreeBusy);

      const result = await service.getFreeBusyInfo(userId, startTime, endTime);

      expect(googleCalendarService.refreshAccessToken).toHaveBeenCalledWith(integration.refreshToken);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: newTokenData.access_token,
        })
      );
      expect(googleCalendarService.getFreeBusyInfo).toHaveBeenCalledWith(
        newTokenData.access_token,
        startTime,
        endTime
      );
      expect(result).toEqual([expectedFreeBusy]);
    });

    it('should handle multiple calendar integrations', async () => {
      const googleIntegration = {
        id: 'google-integration',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: 'google-access-token',
        status: IntegrationStatus.ACTIVE,
        isExpired: jest.fn().mockReturnValue(false),
      };

      const microsoftIntegration = {
        id: 'microsoft-integration',
        userId,
        provider: CalendarProvider.MICROSOFT,
        accessToken: 'microsoft-access-token',
        status: IntegrationStatus.ACTIVE,
        isExpired: jest.fn().mockReturnValue(false),
      };

      const googleFreeBusy = { busy: [{ start: startTime, end: endTime }] };
      const microsoftFreeBusy = { busy: [] };

      mockRepository.find.mockResolvedValue([googleIntegration, microsoftIntegration]);
      mockGoogleCalendarService.getFreeBusyInfo.mockResolvedValue(googleFreeBusy);
      mockMicrosoftCalendarService.getFreeBusyInfo.mockResolvedValue(microsoftFreeBusy);

      const result = await service.getFreeBusyInfo(userId, startTime, endTime);

      expect(googleCalendarService.getFreeBusyInfo).toHaveBeenCalled();
      expect(microsoftCalendarService.getFreeBusyInfo).toHaveBeenCalled();
      expect(result).toEqual([googleFreeBusy, microsoftFreeBusy]);
    });
  });

  describe('createEvent', () => {
    it('should create event in Google Calendar', async () => {
      const userId = 'user-1';
      const eventData = {
        title: 'Meeting with John',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        attendeeEmail: 'john@example.com',
        description: 'Consultation meeting',
      };

      const integration = {
        id: 'integration-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        accessToken: 'access-token',
        status: IntegrationStatus.ACTIVE,
        isExpired: jest.fn().mockReturnValue(false),
      };

      const expectedEvent = {
        id: 'event-123',
        htmlLink: 'https://calendar.google.com/event?eid=...',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      };

      mockRepository.find.mockResolvedValue([integration]);
      mockGoogleCalendarService.createEvent.mockResolvedValue(expectedEvent);

      const result = await service.createEvent(userId, eventData);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, status: IntegrationStatus.ACTIVE },
      });
      expect(googleCalendarService.createEvent).toHaveBeenCalledWith(
        integration.accessToken,
        eventData
      );
      expect(result).toEqual([expectedEvent]);
    });

    it('should return empty array if no active integrations', async () => {
      const userId = 'user-1';
      const eventData = {
        title: 'Meeting',
        startTime: new Date(),
        endTime: new Date(),
        attendeeEmail: 'test@example.com',
      };

      mockRepository.find.mockResolvedValue([]);

      const result = await service.createEvent(userId, eventData);

      expect(result).toEqual([]);
    });
  });
});
