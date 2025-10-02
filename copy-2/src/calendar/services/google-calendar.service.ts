import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import axios from 'axios';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client: any;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      throw new BadRequestException('Failed to exchange code for tokens');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      throw new BadRequestException('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to get user info');
    }
  }

  async getCalendarList(accessToken: string): Promise<any[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      throw new BadRequestException('Failed to get calendar list');
    }
  }

  async getFreeBusyInfo(
    accessToken: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date,
  ): Promise<any[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: calendarIds.map(id => ({ id })),
        },
      });

      const busyTimes = [];
      const calendars = response.data.calendars || {};

      for (const calendarId of calendarIds) {
        const calendarData = calendars[calendarId];
        if (calendarData && calendarData.busy) {
          busyTimes.push(...calendarData.busy);
        }
      }

      return busyTimes;
    } catch (error) {
      throw new BadRequestException('Failed to get free/busy info');
    }
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    eventData: any,
  ): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Add Google Meet conference if requested
      if (eventData.conferenceData) {
        eventData.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      const response = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: eventData.conferenceData ? 1 : 0,
        requestBody: eventData,
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to create event');
    }
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    eventData: any,
  ): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to update event');
    }
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      throw new BadRequestException('Failed to delete event');
    }
  }
}
