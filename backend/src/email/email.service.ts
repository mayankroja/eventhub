import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        // from: 'EventHub <noreply@yourapp.com>', // Use a verified domain
        to,
        subject,
        html,
      });
      if (error) {
        console.error('Resend error:', error);
      }
      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
