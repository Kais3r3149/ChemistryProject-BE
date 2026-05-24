import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'), // Gmail App Password
      },
    });
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const appName = this.config.get<string>('APP_NAME', 'Drug Interaction Checker');

    await this.transporter.sendMail({
      from: `"${appName}" <${this.config.get<string>('MAIL_USER')}>`,
      to,
      subject: `Reset your ${appName} password`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1d4ed8;margin-bottom:8px">Password Reset Request</h2>
          <p style="color:#374151;line-height:1.6">
            We received a request to reset the password for your <strong>${appName}</strong> account.
          </p>
          <p style="color:#374151;line-height:1.6">
            Click the button below to set a new password. This link is valid for
            <strong>1 hour</strong>.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;margin:20px 0;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:13px">
            If you did not request this, you can safely ignore this email.
            Your password will not change.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">
            Or copy this link into your browser:<br/>
            <a href="${resetLink}" style="color:#1d4ed8;word-break:break-all">${resetLink}</a>
          </p>
        </div>
      `,
    });
  }
}
