import { BadRequestException, Body, Controller, Put } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep } from 'src/common/enums/enums';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { InitialDetailsDto } from './dtos/initial-details.dto';
import { LocationDetailsDto } from './dtos/location-details.dto';
import { AvailabilityDetailsDto } from './dtos/availability-details.dto';

function formatErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => Object.values(error.constraints || {}));
}

@Controller('candidate/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Put()
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
        return this.onboardingService.handleStepOne(dto);
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


      case OnboardingStep.AVAILABILITY_DETAILS:{
        if (!data.id) {
          throw new BadRequestException('Client ID is required');
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
}
