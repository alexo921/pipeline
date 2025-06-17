import { Module } from '@nestjs/common';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ExperienceModule } from './experience/experience.module';
import { CandidateService } from './candidate.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  imports: [OnboardingModule, ExperienceModule],
  providers: [CandidateService, PrismaService]
})
export class CandidateModule {}
