import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  OnboardingStepOne,
  OnboardingStepThree,
  OnboardingStepTwo,
} from './interfaces/onboard-steps-interface';
import { OnboardingStep } from 'src/common/enums/enums';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getCandidateById(id?: string) {
    return this.prismaService.candidates.findUnique({
      where: { id: id },
    });
  }

  // setting up onboarding data
  async handleStepOne(data: OnboardingStepOne) {
    const { name, email, healthcareRole, certificationStatus } = data;

    if (!name || !email || !healthcareRole || !certificationStatus) {
      throw new BadRequestException(
        'Name, email, healthcareRole and certificationStatus fields are required!',
      );
    }

    const existingCandidate = await this.prismaService.candidates.findUnique({
      where: { email },
    });

    // if user exists return the existing user
    if (existingCandidate) {
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
    } catch (error) {
      throw new Error(error);
    }
  }

  async handleStepTwo(id: string, data: OnboardingStepTwo) {
    const { zipCode, address, maxTravelDistance } = data;

    if (!zipCode || !maxTravelDistance) {
      throw new BadRequestException(
        'zipCode and maxTravelDistance fields are required ',
      );
    }

    const candidate = await this.getCandidateById(id);

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

  async handleStepThree(id: string, data: OnboardingStepThree) {
    const { workType, currentJobStatus, shiftType } = data;

    const candidate = await this.getCandidateById(id);

    if (!candidate) {
      throw new NotFoundException('No candidate found with this id');
    }

    // const token = this.jwtService.sign({ candidateId: candidate.id, email: candidate.email, role: Role.CANDIDATE});
    //TODO: send email for verification with token


    return this.prismaService.candidates.update({
      where: { id: id },
      data: {
        workType,
        currentJobStatus,
        shiftType,
        step: OnboardingStep.AVIALABILITY_DETAILS,
      },
    });
  }
}
