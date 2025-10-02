import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MicrosoftCalendarService {
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';
  private readonly authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.get('MICROSOFT_CLIENT_ID'),
      response_type: 'code',
      redirect_uri: this.configService.get('MICROSOFT_REDIRECT_URI'),
      scope: 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access',
      response_mode: 'query',
      state: state || '',
    });

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.authUrl}/token`,
        new URLSearchParams({
          client_id: this.configService.get('MICROSOFT_CLIENT_ID'),
          client_secret: this.configService.get('MICROSOFT_CLIENT_SECRET'),
          code,
          redirect_uri: this.configService.get('MICROSOFT_REDIRECT_URI'),
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to exchange code for tokens');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.authUrl}/token`,
        new URLSearchParams({
          client_id: this.configService.get('MICROSOFT_CLIENT_ID'),
          client_secret: this.configService.get('MICROSOFT_CLIENT_SECRET'),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to get user info');
    }
  }

  async getCalendarList(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/calendars`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new BadRequestException('Failed to get calendar list');
    }
  }

  async getFreeBusyInfo(
    accessToken: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/calendar/calendarView`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            startDateTime: timeMin.toISOString(),
            endDateTime: timeMax.toISOString(),
            $select: 'start,end,showAs',
          },
        },
      );

      return response.data.value
        .filter((event: any) => event.showAs === 'busy')
        .map((event: any) => ({
          start: event.start.dateTime,
          end: event.end.dateTime,
        }));
    } catch (error) {
      throw new BadRequestException('Failed to get free/busy info');
    }
  }

  async createEvent(accessToken: string, eventData: any): Promise<any> {
    try {
      // Add Teams meeting if requested
      if (eventData.isOnlineMeeting) {
        eventData.isOnlineMeeting = true;
        eventData.onlineMeetingProvider = 'teamsForBusiness';
      }

      const response = await axios.post(
        `${this.baseUrl}/me/events`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to create event');
    }
  }

  async updateEvent(
    accessToken: string,
    eventId: string,
    eventData: any,
  ): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/me/events/${eventId}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to update event');
    }
  }

  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/me/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to delete event');
    }
  }
}
