import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  received_at: number;
}

@Injectable()
export class EmailService {
  private gmailTokens: GmailTokens | null = null;
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

    try {
      // ✅ Read HTML template file
      const templatePath = path.join(
        process.cwd(),
        'src/templates/password-reset-email.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // ✅ Replace placeholders
      emailTemplate = emailTemplate.replace('{{name}}', name);
      emailTemplate = emailTemplate.replace('{{resetLink}}', resetLink);

      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      // Read the verification HTML template
      const templatePath = path.join(
        process.cwd(),
        'src/templates/verification-email.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholder(s)
      emailTemplate = emailTemplate.replace('{{url}}', url);

      // Send the email
      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Confirm Your Email',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    try {
      // Read the welcome HTML template
      const templatePath = path.join(
        process.cwd(),
        'src/templates/welcome-email.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      emailTemplate = emailTemplate.replace('{{firstName}}', firstName);
      emailTemplate = emailTemplate.replace('{{jobsUrl}}', `${process.env.FRONTEND_URL}/jobs`);

      // Send the email
      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Pipeline 👋',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Gmail OAuth Token Management
  storeGmailTokens(tokens: any) {
    this.gmailTokens = {
      ...tokens,
      received_at: Date.now()
    };
    console.log('Gmail tokens stored successfully');
  }

  isGmailAuthorized(): boolean {
    if (!this.gmailTokens) return false;
    
    // Check if token is expired (expires_in is in seconds)
    const expiresAt = this.gmailTokens.received_at + (this.gmailTokens.expires_in * 1000);
    return Date.now() < expiresAt;
  }

  getGmailTokens(): GmailTokens | null {
    return this.gmailTokens;
  }

  // Gmail API Email Sending
  async sendEmailViaGmailAPI(to: string, subject: string, htmlContent: string): Promise<any> {
    if (!this.isGmailAuthorized()) {
      throw new Error('Gmail not authorized or token expired');
    }

    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\n');

    const encodedEmail = Buffer.from(emailContent).toString('base64');

    try {
      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          raw: encodedEmail
        },
        {
          headers: {
            'Authorization': `Bearer ${this.gmailTokens!.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Gmail API send failed:', error);
      throw new Error('Failed to send email via Gmail API');
    }
  }

  // Enhanced send method with Gmail API fallback
  async sendMailWithGmailFallback(to: string, subject: string, name: string, message: string) {
    const html = this.htmlTemplate(name, message);

    // Try Gmail API first if available
    if (this.isGmailAuthorized()) {
      try {
        const result = await this.sendEmailViaGmailAPI(to, subject, html);
        return { 
          result, 
          method: 'gmail-api',
          success: true 
        };
      } catch (error) {
        console.log('Gmail API failed, falling back to SMTP:', error.message);
      }
    }

    // Fallback to SMTP
    try {
      const result = await this.sendMail(to, subject, name, message);
      return {
        result, 
        method: 'smtp',
        success: true 
      };
    } catch (error) {
      console.error('Both Gmail API and SMTP failed:', error);
      throw new Error('Failed to send email via both Gmail API and SMTP');
    }
  }
}
