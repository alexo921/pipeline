import { Module } from '@nestjs/common';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CandidateService } from '../candidate.service';

@Module({
  controllers: [ExperienceController],
  providers: [ExperienceService, PrismaService, CandidateService],
})
export class ExperienceModule {}
