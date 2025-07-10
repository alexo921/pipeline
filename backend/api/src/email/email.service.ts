import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
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
  private readonly tokenFilePath = path.join(process.cwd(), 'tokens', 'gmail-tokens.json');
  
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  constructor() {
    // Load tokens from file on service initialization
    this.loadGmailTokensFromFile();
  }

  // Load tokens from file
  private loadGmailTokensFromFile(): void {
    try {
      // Ensure tokens directory exists
      const tokensDir = path.dirname(this.tokenFilePath);
      if (!fs.existsSync(tokensDir)) {
        fs.mkdirSync(tokensDir, { recursive: true });
      }
      
      if (fs.existsSync(this.tokenFilePath)) {
        const tokenData = fs.readFileSync(this.tokenFilePath, 'utf8');
        this.gmailTokens = JSON.parse(tokenData);
        console.log('Gmail tokens loaded from file');
      }
    } catch (error) {
      console.error('Failed to load Gmail tokens from file:', error);
      this.gmailTokens = null;
    }
  }

  // Save tokens to file
  private saveGmailTokensToFile(): void {
    try {
      if (this.gmailTokens) {
        fs.writeFileSync(this.tokenFilePath, JSON.stringify(this.gmailTokens, null, 2));
        console.log('Gmail tokens saved to file');
      }
    } catch (error) {
      console.error('Failed to save Gmail tokens to file:', error);
    }
  }

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

  async sendPartialSignupReminder(email: string, firstName: string) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/partial-signup-reminder.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      emailTemplate = emailTemplate.replace('{{firstName}}', firstName);
      emailTemplate = emailTemplate.replace('{{profileUrl}}', `${process.env.FRONTEND_URL}/dashboard`);

      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Just one step to unlock great jobs 💼',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send partial signup reminder:', error);
      throw new Error('Failed to send partial signup reminder');
    }
  }

  async sendApplyNudgeEmail(email: string, firstName: string) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/apply-nudge-email.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      emailTemplate = emailTemplate.replace('{{firstName}}', firstName);
      emailTemplate = emailTemplate.replace('{{jobsUrl}}', `${process.env.FRONTEND_URL}/jobs`);

      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Did you apply yet?',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send apply nudge email:', error);
      throw new Error('Failed to send apply nudge email');
    }
  }

  async sendLocalJobAlert(email: string, firstName: string, city: string, jobCount: number) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/local-job-alert.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      emailTemplate = emailTemplate.replace(/{{firstName}}/g, firstName);
      emailTemplate = emailTemplate.replace(/{{city}}/g, city);
      emailTemplate = emailTemplate.replace(/{{jobCount}}/g, jobCount.toString());
      emailTemplate = emailTemplate.replace('{{cityJobsUrl}}', `${process.env.FRONTEND_URL}/jobs?city=${encodeURIComponent(city)}`);

      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${jobCount} caregiver jobs hiring near ${city} 🩺`,
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send local job alert:', error);
      throw new Error('Failed to send local job alert');
    }
  }

  async sendLaunchEmail(email: string, firstName: string) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/launch-email.html',
      );
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      emailTemplate = emailTemplate.replace('{{firstName}}', firstName);
      emailTemplate = emailTemplate.replace('{{jobsUrl}}', `${process.env.FRONTEND_URL}/jobs`);

      const mailOptions = {
        from: `"Pipeline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'You\'re up first. Pipeline is now live 🎉',
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Failed to send launch email:', error);
      throw new Error('Failed to send launch email');
    }
  }

  // Gmail OAuth Token Management
  storeGmailTokens(tokens: any) {
    this.gmailTokens = {
      ...tokens,
      received_at: Date.now()
    };
    // Save to file for persistence
    this.saveGmailTokensToFile();
    console.log('Gmail tokens stored and persisted successfully');
  }

  isGmailAuthorized(): boolean {
    if (!this.gmailTokens) return false;
    
    // Check if token is expired (expires_in is in seconds)
    const expiresAt = this.gmailTokens.received_at + (this.gmailTokens.expires_in * 1000);
    const isValid = Date.now() < expiresAt;
    
    if (!isValid) {
      console.log('Gmail token expired, attempting refresh...');
      // Try to refresh the token if we have a refresh token
      if (this.gmailTokens.refresh_token) {
        this.refreshGmailToken().catch(error => {
          console.error('Failed to refresh Gmail token:', error);
        });
      }
    }
    
    return isValid;
  }

  // Refresh Gmail token using refresh token
  private async refreshGmailToken(): Promise<void> {
    if (!this.gmailTokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: this.gmailTokens.refresh_token,
        grant_type: 'refresh_token'
      });

      const newTokens = {
        ...this.gmailTokens,
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        received_at: Date.now()
      };

      this.gmailTokens = newTokens;
      this.saveGmailTokensToFile();
      console.log('Gmail token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh Gmail token:', error);
      throw error;
    }
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
      
      // If it's an auth error, try to refresh the token
      if (error.response?.status === 401 && this.gmailTokens?.refresh_token) {
        console.log('Attempting to refresh expired token...');
        try {
          await this.refreshGmailToken();
          // Retry the email send with the new token
          return this.sendEmailViaGmailAPI(to, subject, htmlContent);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
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
