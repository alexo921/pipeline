import {
  BadRequestException,
  Body,
  Controller,
  Put,
  Post,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep } from 'src/common/enums/enums';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { InitialDetailsDto } from './dtos/initial-details.dto';
import { IntakeDetailsDto } from './dtos/intake-details.dto';
import { LocationDetailsDto } from './dtos/location-details.dto';
import { AvailabilityDetailsDto } from './dtos/availability-details.dto';
import { SetPassword } from './dtos/set-password.dto';
import { CandidateService } from '../candidate.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

function formatErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => Object.values(error.constraints || {}));
}

@ApiTags('Candidate Onboarding')
@Controller('candidate/onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly candidateService: CandidateService,
  ) {}

  @Put()
  @ApiOperation({ summary: 'Handle onboarding steps' })
  async handleOnboarding(@Body() data: any) {
    if (!data.step || !Object.values(OnboardingStep).includes(data.step)) {
      throw new BadRequestException('Invalid step number');
    }

    switch (data.step) {
      case OnboardingStep.INITIAL_DETAILS: {
        const dto = plainToInstance(InitialDetailsDto, data);
        const errors = await validate(dto);
        if (errors.length > 0) {
          throw new BadRequestException(formatErrors(errors));
        }
        const existingCandidate =
          await this.candidateService.getCandidateByEmail(dto.email);
        if (existingCandidate) {
          throw new BadRequestException(
            `User already exists with email ${dto.email}`,
          );
        }
        return this.onboardingService.handleStepOne(dto);
      }

      case 'INTAKE_DETAILS': {
        const dto = plainToInstance(IntakeDetailsDto, data);
        const errors = await validate(dto);
        if (errors.length > 0) {
          throw new BadRequestException(formatErrors(errors));
        }
        return this.onboardingService.handleIntakeDetails(dto);
      }

      case OnboardingStep.LOCATION_DETAILS: {
        if (!data.id) {
          throw new BadRequestException('ID is required');
        }
        const dto = plainToInstance(LocationDetailsDto, data);
        const errors = await validate(dto);
        if (errors.length > 0) {
          throw new BadRequestException(formatErrors(errors));
        }

        return this.onboardingService.handleStepTwo(dto.id, dto);
      }

      case OnboardingStep.AVAILABILITY_DETAILS: {
        if (!data.id) {
          throw new BadRequestException('ID is required');
        }
        const dto = plainToInstance(AvailabilityDetailsDto, data);
        const errors = await validate(dto);
        if (errors.length > 0) {
          throw new BadRequestException(formatErrors(errors));
        }

        return this.onboardingService.handleStepThree(dto.id, dto);
      }

      default:
        throw new BadRequestException('Invalid step number');
    }
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  verifyEmail(@Body('token') token: string) {
    return this.onboardingService.verifyEmail(token);
  }

  @Post('set-password')
  @ApiOperation({ summary: 'Set user password' })
  setPassword(@Body() dto: SetPassword) {
    return this.onboardingService.setPassword(dto);
  }
}
