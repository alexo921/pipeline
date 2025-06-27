import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  htmlTemplate(name: string, message: string) {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #333;">Hello ${name},</h2>
      <p style="font-size: 16px; color: #555;">${message}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 14px; color: #999;">Best regards,<br/><strong>Pipeline Team</strong></p>
    </div>
  `;
  }

  async sendMail(to: string, subject: string, name: string, message: string) {
    const html = this.htmlTemplate(name, message);

    const mailOptions = {
      from: `"Pipeline" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return info;
  }

  async sendPasswordResetEmail(email: string, token: string, name: string) {
    const resetLink = `${process.env.FRONTEND_URL}/change-password?token=${token}`;

    const contentHtml = `
      <p style="font-size: 16px; color: #555;">
        We received a request to reset your password. Click the button below to proceed:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="padding: 12px 24px; font-size: 16px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">
        This link will expire in 15 minutes. If you didn't request a password reset, ignore this email.
      </p>
    `;

    const html = this.htmlTemplate(name, contentHtml);

    const mailOptions = {
      from: `"Pipeline" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return info;
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
    <h2>Welcome!</h2>
    <p>You've created a new account. Please confirm your email:</p>
    <a href="${url}">✔ Confirm Email</a>
  `;

    await this.sendMail(email, 'Confirm Your Email', 'User', html);
  }
}
