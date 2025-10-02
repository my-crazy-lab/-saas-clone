import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    await this.twilioClient.messages.create({
      body: message,
      from: this.fromNumber,
      to,
    });
  }

  async sendBookingReminder(to: string, bookingData: any): Promise<void> {
    const message = `Reminder: You have a meeting "${bookingData.meetingType.title}" starting at ${new Date(bookingData.startTime).toLocaleTimeString()}. ${bookingData.meetingUrl ? `Join: ${bookingData.meetingUrl}` : ''}`;
    
    await this.sendSms(to, message);
  }
}
