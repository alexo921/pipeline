import { BadRequestException, Body, Controller, Put } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingDto } from './dtos/onboarding.dto';
import { OnboardingStep } from 'src/common/enums/enums';

@Controller('candidate/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Put()
  async handleOnboarding(@Body() data: any) {

    if (!data.step || !Object.values(OnboardingStep).includes(data.step)) {
      throw new BadRequestException('Invalid step number');
    }

    switch (data.step) {
      case OnboardingStep.INITIAL_DETAILS:
        return this.onboardingService.handleStepOne({
          name: data.name,
          email: data.email,
          healthcareRole: data.healthcareRole,
          certificationStatus: data.certificationStatus,
        });

      case OnboardingStep.LOCATION_DETAILS:
        if (!data.id) {
          throw new BadRequestException('ID is required');
        }

        return this.onboardingService.handleStepTwo(data.id, {
          zipCode: data.zipCode,
          address: data.address,
          maxTravelDistance: data.maxTravelDistance,
        });

      case OnboardingStep.AVIALABILITY_DETAILS:
        if (!data.id) {
          throw new BadRequestException('Client ID is required');
        }
        return this.onboardingService.handleStepThree(data.id, {
          workType: data.workType,
          shiftType: data.shiftType,
          currentJobStatus: data.currentJobStatus,
        });

      default:
        throw new BadRequestException('Invalid step number');
    }
  }
}
