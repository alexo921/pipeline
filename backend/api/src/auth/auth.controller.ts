import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  Query,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login-dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { error } from 'console';
import { ForgotPassDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/Reset-password-Dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { EmailService } from 'src/email/email.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.create(signUpDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login an existing user' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.loginUser(loginDto);

    res.cookie('access_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return { token: response.token, user: response.result };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout the user' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() forgotDto: ForgotPassDto) {
    return this.authService.forgotPass(forgotDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  resetPass(@Body() resetPassDto: ResetPasswordDto) {
    return this.authService.resetPass(resetPassDto);
  }

  @ApiOperation({ summary: 'Change user password' })
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @ApiBearerAuth()
  changePass(
    @User('email') email: string,
    @Body() changePassDto: ChangePasswordDto,
  ) {
    return this.authService.changePass(email, changePassDto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  initiateGoogleAuth(@Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = `${this.configService.get<string>('APP_URL')}${this.configService.get<string>('GOOGLE_CALLBACK_URL')}`;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=profile email`;

    return res.redirect(authUrl);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async handleGoogleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) throw new Error('No authorization code received');

      const accessToken = await this.authService.exchangeGoogleCode(code);
      const userInfo = await this.authService.getGoogleUserInfo(accessToken);
      const user = await this.authService.findOrCreateUser(userInfo);

      const jwt = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      });

      // return res.send({ token: jwt, user: userInfo });
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${jwt}&email=${user.email}`,
      );
    } catch (err: unknown) {
      error('Google OAuth error', (err as Error).stack);
      return res.status(500).send({
        error: 'Google authentication failed',
        details: (err as Error).message,
      });
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  getProfile(@User('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  // Gmail OAuth Endpoints
  @Get('gmail')
  @ApiOperation({ summary: 'Initiate Gmail OAuth for email sending' })
  initiateGmailAuth(@Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = `${this.configService.get<string>('APP_URL')}/auth/gmail/callback`;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=https://www.googleapis.com/auth/gmail.send&` +
      `access_type=offline&` +
      `prompt=consent`;

    return res.redirect(authUrl);
  }

  @Get('gmail/callback')
  @ApiOperation({ summary: 'Handle Gmail OAuth callback' })
  async handleGmailCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) throw new Error('No authorization code received');

      const tokens = await this.authService.exchangeGmailCode(code);
      
      // Store tokens in email service
      this.emailService.storeGmailTokens(tokens);
      
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/admin?gmail_setup=success`
      );
    } catch (err: unknown) {
      error('Gmail OAuth error', (err as Error).stack);
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/admin?gmail_setup=error&message=${encodeURIComponent((err as Error).message)}`
      );
    }
  }

  @Get('gmail/status')
  @ApiOperation({ summary: 'Check Gmail OAuth status' })
  async getGmailStatus() {
    const isAuthorized = this.emailService.isGmailAuthorized();
    
    return {
      authorized: isAuthorized,
      setupUrl: `${this.configService.get<string>('APP_URL')}/auth/gmail`,
      message: isAuthorized 
        ? 'Gmail OAuth configured successfully. Emails will be sent via Gmail API.'
        : 'Gmail OAuth not configured. Visit setupUrl to authorize.'
    };
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Test email sending (Gmail API or SMTP fallback)' })
  async testEmail(@Body() body: { email: string }) {
    try {
      const result = await this.emailService.sendMailWithGmailFallback(
        body.email,
        'Test Email from Pipeline',
        'Test User',
        'This is a test email to verify your email configuration is working correctly.'
      );
      
      return {
        success: true,
        message: `Test email sent successfully to ${body.email}`,
        method: result.method,
        details: `Email sent via ${result.method.toUpperCase()}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test email to ${body.email}`,
        method: 'none',
        error: error.message
      };
    }
  }

  @Post('test-email-templates')
  @ApiOperation({ summary: 'Test all email templates' })
  async testEmailTemplates(@Body() body: { email: string; firstName?: string }) {
    const { email, firstName = 'Test User' } = body;
    const results: Array<{
      template: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    // Test verification email
    try {
      const verificationToken = this.jwtService.sign(
        { email, purpose: 'email-verification' },
        { expiresIn: '24h' }
      );
      await this.emailService.sendVerificationEmail(email, verificationToken);
      results.push({ template: 'verification', success: true, message: 'Verification email sent' });
    } catch (error) {
      results.push({ template: 'verification', success: false, error: error.message });
    }

    // Test password reset email
    try {
      const resetToken = this.jwtService.sign(
        { email, purpose: 'password-reset' },
        { expiresIn: '15m' }
      );
      await this.emailService.sendPasswordResetEmail(email, resetToken, firstName);
      results.push({ template: 'password-reset', success: true, message: 'Password reset email sent' });
    } catch (error) {
      results.push({ template: 'password-reset', success: false, error: error.message });
    }

    // Test welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, firstName);
      results.push({ template: 'welcome', success: true, message: 'Welcome email sent' });
    } catch (error) {
      results.push({ template: 'welcome', success: false, error: error.message });
    }

    return {
      message: `Email template tests completed for ${email}`,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
}
