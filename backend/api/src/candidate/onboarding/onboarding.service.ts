import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OnboardingStep } from 'src/common/enums/enums';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { AvailabilityDetailsDto } from './dtos/availability-details.dto';
import { InitialDetailsDto } from './dtos/initial-details.dto';
import { LocationDetailsDto } from './dtos/location-details.dto';
import { EmailService } from 'src/email/email.service';
import { SetPassword } from './dtos/set-password.dto';
import * as bcrypt from 'bcryptjs';
import { CandidateService } from '../candidate.service';
import { JwtPayload } from 'src/auth/auth.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly candidateService: CandidateService,
  ) {}

  // setting up onboarding data
  async handleStepOne(data: InitialDetailsDto) {
    const { name, email, healthcareRole, certificationStatus } = data;

    const existingCandidate =
      await this.candidateService.getCandidateByEmail(email);

    if (existingCandidate) {
      if (existingCandidate.isOnboarded) {
        throw new BadRequestException(
          `User already exists with same email ${email}`,
        );
      }
      return existingCandidate;
    }

    try {
      // creating user for candidate
      const user = await this.prismaService.users.create({
        data: {
          name,
          email,
          password: '',
        },
      });

      // create candidate record
      const candidate = await this.prismaService.candidates.create({
        data: {
          name: name,
          email: email,
          healthcareRole: healthcareRole,
          certificationStatus: certificationStatus,
          userId: user.id,
          step: OnboardingStep.INITIAL_DETAILS,
        },
      });

      return candidate;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  async handleStepTwo(id: string, data: LocationDetailsDto) {
    const { zipCode, address, maxTravelDistance } = data;

    const candidate = await this.candidateService.getCandidateById(id);

    if (!candidate) {
      throw new NotFoundException('No candidate found with this id');
    }

    return this.prismaService.candidates.update({
      where: { id: id },
      data: {
        zipCode,
        address,
        maxTravelDistance,
        step: OnboardingStep.LOCATION_DETAILS,
      },
    });
  }

  async handleStepThree(id: string, data: AvailabilityDetailsDto) {
    const { workType, currentJobStatus, shiftType } = data;

    const candidate = await this.candidateService.getCandidateById(id);

    if (!candidate) {
      throw new NotFoundException('No candidate found with this id');
    }

    const token = this.jwtService.sign(
      {
        candidateId: candidate.id,
        email: candidate.email,
        role: candidate.healthcareRole,
      },
      { expiresIn: '1h' },
    );
    // TODO: send email for verification with token
    await this.emailService.sendVerificationEmail(candidate.email, token);

    return await this.prismaService.candidates.update({
      where: { id: id },
      data: {
        workType,
        currentJobStatus,
        shiftType,
        step: OnboardingStep.AVAILABILITY_DETAILS,
      },
    });
  }

  async verifyEmail(token: string) {
    try {
      const payload: JwtPayload = this.jwtService.verify<JwtPayload>(token);

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new BadRequestException('Token has expired');
      }

      const candidate = await this.candidateService.getCandidateByEmail(
        payload.email,
      );

      if (!candidate) {
        throw new BadRequestException('Invalid token');
      }

      return {
        message: 'Email verified',
        redirectUrl: `${process.env.FRONTEND_URL}/set-password?token=${token}`,
      };
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException('Invalid token');
      }
      throw error;
    }
  }

  async setPassword(dto: SetPassword) {
    const { password, token } = dto;
    const payload: JwtPayload = this.jwtService.verify<JwtPayload>(token);

    if (!payload) {
      throw new BadRequestException('Invalid token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prismaService.$transaction([
      this.prismaService.users.update({
        where: { email: payload.email },
        data: { password: hashedPassword },
      }),
      this.prismaService.candidates.update({
        where: { email: payload.email },
        data: {
          isOnboarded: true,
          isActive: true,
        },
      }),
    ]);

    return {
      message: 'Password set successfully and onboarding completed',
    };
  }
}
