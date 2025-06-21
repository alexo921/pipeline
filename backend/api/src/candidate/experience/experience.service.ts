import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CandidateService } from '../candidate.service';

@Injectable()
export class ExperienceService {
  constructor(
    private prismaService: PrismaService,
    private candidateService: CandidateService
  ) {}

  
  async create(data: CreateExperienceDto) {
    const candidate = this.candidateService.getCandidateById(data.candidateId);

    if (!candidate) {
      throw new BadRequestException('Invalid candidate ID');
    }

    if(data.isCurrent == false && (data.endDate == '' || data.endDate == null) ){
      throw new BadRequestException("End date field is required when isCurrent is false!");
    }

    if(data.isCurrent == null && (data.endDate == '' || data.endDate == null) ){
      throw new BadRequestException("End date field is required");
    }

    return this.prismaService.experiences.create({ data });
  }

  async findAll(candidateId: string) {

    if (!candidateId) {
      throw new BadRequestException('candidate ID is required');
    }

    const candidate = this.candidateService.getCandidateById(candidateId);

    if (!candidate) {
      throw new BadRequestException('Invalid candidate ID');
    }

    return this.prismaService.experiences.findMany({
      where: { candidateId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const experience = await this.prismaService.experiences.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return experience;
  }

  async update(id: string, data: UpdateExperienceDto) {
    const experience = await this.prismaService.experiences.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return this.prismaService.experiences.update({ where: { id }, data });
  }

  async remove(id: string) {
    const experience = await this.prismaService.experiences.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return this.prismaService.experiences.delete({ where: { id } });
  }
}
