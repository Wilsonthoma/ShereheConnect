import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set — emails will not be sent');
    }
    this.resend = new Resend(apiKey || 'missing-key');
    this.from = process.env.EMAIL_FROM || 'ShereheConnect <onboarding@resend.dev>';
  }

  async send(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`Email skipped (no API key): to=${options.to} subject="${options.subject}"`);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        this.logger.error(`Failed to send email: ${result.error.message}`);
        return { success: false, error: result.error.message };
      }

      this.logger.log(`Email sent: ${result.data?.id} → ${options.to}`);
      return { success: true, id: result.data?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Email exception: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
