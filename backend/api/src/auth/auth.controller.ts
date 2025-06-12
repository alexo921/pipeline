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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.create(signUpDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotDto: ForgotPassDto) {
    return this.authService.forgotPass(forgotDto);
  }

  @Post('reset-password')
  resetPass(@Body() resetPassDto: ResetPasswordDto) {
    return this.authService.resetPass(resetPassDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePass(@Request() req, @Body() changePassDto: ChangePasswordDto) {
    return this.authService.changePass(req.user.email, changePassDto);
  }

  @Get('google')
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

      return res.send({ token: jwt, user: userInfo });
    } catch (err) {
      error('Google OAuth error', err.stack);
      return res.status(500).send({
        error: 'Google authentication failed',
        details: err.message,
      });
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    const id = req.user.userId;
    return this.authService.getProfile(id);
  }
}
