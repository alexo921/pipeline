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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.signup(signUpDto);

    res.cookie('access_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return {
      message: 'User registered successfully',
      user: response.result,
    };
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

    return { token: response.token, user: response.user };
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
}
