import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async exchangeGoogleCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${this.configService.get<string>('APP_URL')}${this.configService.get<string>('GOOGLE_CALLBACK_URL')}`;

    const response = await axios.post(
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

  async getGoogleUserInfo(token: string): Promise<any> {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  }

  async findOrCreateUser(userInfo: any): Promise<any> {
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
    const isUser = await this.prismaService.users.findUnique({ where: { email } });
    
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
    const user = await this.prismaService.users.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
