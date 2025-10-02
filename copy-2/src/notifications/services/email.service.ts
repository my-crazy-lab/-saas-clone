import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private useSendGrid: boolean;

  constructor(private readonly configService: ConfigService) {
    const sendGridApiKey = this.configService.get('SENDGRID_API_KEY');
    
    if (sendGridApiKey) {
      this.useSendGrid = true;
      sgMail.setApiKey(sendGridApiKey);
    } else {
      this.useSendGrid = false;
      // Fallback to SMTP
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST', 'localhost'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const from = this.configService.get('FROM_EMAIL', 'noreply@schedulingapp.com');

    if (this.useSendGrid) {
      const msg = {
        to,
        from,
        subject,
        text: text || '',
        html,
      };

      await sgMail.send(msg);
    } else {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text: text || '',
        html,
      });
    }
  }

  async sendBookingConfirmation(
    to: string,
    bookingData: any,
  ): Promise<void> {
    const subject = `Booking Confirmed: ${bookingData.meetingType.title}`;
    const html = this.generateBookingConfirmationHtml(bookingData);
    
    await this.sendEmail(to, subject, html);
  }

  async sendBookingReminder(
    to: string,
    bookingData: any,
  ): Promise<void> {
    const subject = `Reminder: ${bookingData.meetingType.title} starting soon`;
    const html = this.generateBookingReminderHtml(bookingData);
    
    await this.sendEmail(to, subject, html);
  }

  private generateBookingConfirmationHtml(bookingData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed</h2>
        <p>Your booking has been confirmed with the following details:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${bookingData.meetingType.title}</h3>
          <p><strong>Date:</strong> ${new Date(bookingData.startTime).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(bookingData.startTime).toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> ${bookingData.duration} minutes</p>
          ${bookingData.meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${bookingData.meetingUrl}">${bookingData.meetingUrl}</a></p>` : ''}
        </div>
        
        <p>If you need to reschedule or cancel, please use the links below:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/reschedule/${bookingData.rescheduleToken}" style="color: #007bff;">Reschedule</a> | 
          <a href="${process.env.FRONTEND_URL}/cancel/${bookingData.cancelToken}" style="color: #dc3545;">Cancel</a>
        </p>
        
        <p>Thank you!</p>
      </div>
    `;
  }

  private generateBookingReminderHtml(bookingData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Meeting Reminder</h2>
        <p>This is a reminder that you have a meeting starting soon:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${bookingData.meetingType.title}</h3>
          <p><strong>Date:</strong> ${new Date(bookingData.startTime).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(bookingData.startTime).toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> ${bookingData.duration} minutes</p>
          ${bookingData.meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${bookingData.meetingUrl}">${bookingData.meetingUrl}</a></p>` : ''}
        </div>
        
        <p>See you soon!</p>
      </div>
    `;
  }
}
