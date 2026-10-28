import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private get fromAddress(): string {
    return process.env.EMAIL_FROM || 'noreply@jobplatform.dev';
  }

  private get appName(): string {
    return process.env.APP_NAME || 'JobPlatform';
  }

  private get appUrl(): string {
    return process.env.APP_URL || 'http://localhost:5173';
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    await this.send({
      to,
      subject: `Verify your ${this.appName} account`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Welcome to ${this.appName}, ${name}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Verify Email
          </a>
          <p style="margin-top:16px;color:#6b7280;font-size:14px;">
            This link expires in 24 hours. If you did not create an account, please ignore this email.
          </p>
          <p style="color:#6b7280;font-size:12px;">Or copy this URL: ${verifyUrl}</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    await this.send({
      to,
      subject: `Reset your ${this.appName} password`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Reset Password
          </a>
          <p style="margin-top:16px;color:#6b7280;font-size:14px;">
            This link expires in 1 hour. If you did not request a password reset, please ignore this email.
          </p>
          <p style="color:#6b7280;font-size:12px;">Or copy this URL: ${resetUrl}</p>
        </div>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // Log email content in dev when SMTP is not configured
      this.logger.warn(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.debug(options.html.replace(/<[^>]+>/g, ''));
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.appName}" <${this.fromAddress}>`,
        ...options,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
      // Do not throw — email failures should not crash the request in most flows
    }
  }
}
