import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ForgotPassDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/Reset-password-Dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { EmailService } from 'src/email/email.service';
import { users } from '@prisma/client';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  candidateId?: string | null;
  purpose?: string; // For password reset
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async exchangeGoogleCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${this.configService.get<string>('APP_URL')}${this.configService.get<string>('GOOGLE_CALLBACK_URL')}`;

    const response = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  async getGoogleUserInfo(token: string): Promise<GoogleUserInfo> {
    const response = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  }

  async findOrCreateUser(userInfo: GoogleUserInfo): Promise<users> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { email: userInfo.email },
    });

    if (existingUser) {
      return existingUser;
    }

    const newUser = await this.prismaService.users.create({
      data: {
        name: userInfo.name,
        email: userInfo.email,
        password: '',
      },
    });

    return newUser;
  }

  async create(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;
    const isUser = await this.prismaService.users.findUnique({
      where: { email },
    });

    if (isUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.users.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });
    return user;
  }

  async loginUser(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email || !password) throw new BadRequestException('Email and password are required');

    const user = (await this.prismaService.users.findUnique({
      where: { email },
      include: {
        candidate: {
          select: {
            id: true,
          },
        },
      },
    }));

    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      candidateId: user.candidate?.id || null,
    };
    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return { token, result };
  }

  async forgotPass(forgotPass: ForgotPassDto) {
    const email = forgotPass.email;

    if (!email) {
      throw new BadRequestException('Email is required');
    }
    
    const isUser = await this.prismaService.users.findUnique({
      where: { email },
    });
    if (!isUser) {
      throw new NotFoundException('User not found with that email');
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    const token = this.jwtService.sign(
      { email, purpose: 'reset-password' },
      {
        secret,
        expiresIn: '15m',
      },
    );

    await this.emailService.sendPasswordResetEmail(email, token, isUser.name);
    return {
      message: 'A password reset link has been sent to your email.',
    };
  }

  async resetPass(resetPassDto: ResetPasswordDto) {
    const { token, newPassword } = resetPassDto;
    let payload: JwtPayload;

    const secret = this.configService.get<string>('JWT_SECRET');

    try {
      payload = this.jwtService.verify<JwtPayload>(token, { secret });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (payload.purpose !== 'reset-password') {
      throw new BadRequestException('Invalid token purpose');
    }

    const user = await this.prismaService.users.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    await this.prismaService.users.update({
      where: { email: payload.email },
      data: { password: hashPassword },
    });

    return { message: 'Password has been reset successfully' };
  }

  async changePass(email: string, changePassDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePassDto;

    const user = await this.prismaService.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prismaService.users.update({
      where: { email },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(id: string): Promise<Partial<users>> {
    const user = await this.prismaService.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
