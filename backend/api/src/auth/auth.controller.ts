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
import { PrismaService } from 'src/common/prisma/prisma.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.create(signUpDto);
    
    // Create JWT token for the new user
    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      candidateId: null,
    });

    // Set the HTTP-only cookie
    res.cookie('access_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return { token: jwt, user: result };
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
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

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

      // Get candidate ID if user has a candidate profile
      const userWithCandidate = await this.prismaService.users.findUnique({
        where: { id: user.id },
        include: {
          candidate: {
            select: {
              id: true,
            },
          },
        },
      });
      
      const jwt = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        candidateId: userWithCandidate?.candidate?.id || null,
      });

      // Set the HTTP-only cookie
      res.cookie('access_token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });

      // Redirect to homepage with signed_in parameter
      return res.redirect(`${process.env.FRONTEND_URL}/?signed_in=true`);
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
    return { data: this.authService.getProfile(userId) };
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
        method: 'Gmail API',
        details: `Email sent via Gmail API`
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

  @Post('send-launch')
  @ApiOperation({ summary: 'Send launch email to waitlist subscriber' })
  async sendLaunchEmail(@Body() body: { email: string; firstName: string }) {
    try {
      const { email, firstName } = body;
      
      if (!email || !firstName) {
        return {
          success: false,
          message: 'Email and firstName are required',
          error: 'Missing required fields'
        };
      }

      await this.emailService.sendLaunchEmail(email, firstName);
      
      return {
        success: true,
        message: `Launch email sent successfully to ${firstName} (${email})`,
        email,
        firstName
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send launch email',
        error: error.message
      };
    }
  }

  @Post('test-email-templates')
  @ApiOperation({ summary: 'Test all email templates' })
  async testEmailTemplates(@Body() body: { 
    email: string; 
    firstName?: string; 
    lastName?: string;
    city?: string; 
    jobCount?: number;
    jobTitle?: string;
    company?: string;
    profileUrl?: string;
    jobsUrl?: string;
  }) {
    // Enhanced mock data with realistic values
    const { 
      email, 
      firstName = 'Sarah', 
      lastName = 'Johnson',
      city = 'Austin', 
      jobCount = 23,
      jobTitle = 'Registered Nurse',
      company = 'Austin Medical Center',
      profileUrl = `${process.env.FRONTEND_URL}/dashboard/profile`,
      jobsUrl = `${process.env.FRONTEND_URL}/jobs`
    } = body;

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
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
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

    // Test partial signup reminder
    try {
      await this.emailService.sendPartialSignupReminder(email, firstName);
      results.push({ template: 'partial-signup-reminder', success: true, message: 'Partial signup reminder sent' });
    } catch (error) {
      results.push({ template: 'partial-signup-reminder', success: false, error: error.message });
    }

    // Test apply nudge email
    try {
      await this.emailService.sendApplyNudgeEmail(email, firstName);
      results.push({ template: 'apply-nudge', success: true, message: 'Apply nudge email sent' });
    } catch (error) {
      results.push({ template: 'apply-nudge', success: false, error: error.message });
    }

    // Test local job alert
    try {
      await this.emailService.sendLocalJobAlert(email, firstName, city, jobCount);
      results.push({ template: 'local-job-alert', success: true, message: 'Local job alert sent' });
    } catch (error) {
      results.push({ template: 'local-job-alert', success: false, error: error.message });
    }

    // Test launch email
    try {
      await this.emailService.sendLaunchEmail(email, firstName);
      results.push({ template: 'launch-email', success: true, message: 'Launch email sent' });
    } catch (error) {
      results.push({ template: 'launch-email', success: false, error: error.message });
    }

    // Test top 10 jobs weekly digest
    try {
      await this.emailService.sendTemplateMail(
        email,
        'Top 10 Jobs This Week',
        'top_10_jobs_this_week',
        {
          firstName,
          jobsUrl
        }
      );
      results.push({ template: 'top_10_jobs_this_week', success: true, message: 'Top 10 jobs weekly digest sent' });
    } catch (error) {
      results.push({ template: 'top_10_jobs_this_week', success: false, error: error.message });
    }

    return {
      message: `Email template tests completed for ${email}`,
      mockData: {
        firstName,
        lastName,
        city,
        jobCount,
        jobTitle,
        company,
        profileUrl,
        jobsUrl,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=test-token`,
        resetUrl: `${process.env.FRONTEND_URL}/change-password?token=test-token`,
        cityJobsUrl: `${process.env.FRONTEND_URL}/jobs?city=${encodeURIComponent(city)}`
      },
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
}
