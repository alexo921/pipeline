import { Module } from '@nestjs/common';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [OnboardingModule]
})
export class CandidateModule {}
