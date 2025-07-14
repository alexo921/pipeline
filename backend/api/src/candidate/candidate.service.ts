import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-list-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IntakeCompleteEvent,
  JobApplyClickedNoConfirmEvent
} from '../events/user-events';

@Injectable()
export class CandidateService {
  constructor(private readonly prismaService: PrismaService, private eventEmitter: EventEmitter2) {}

  async getCandidateById(id: string) {
    return this.prismaService.candidates.findUnique({
      where: { id: id },
    });
  }

  async getCandidateByEmail(email: string) {
    return this.prismaService.candidates.findUnique({
      where: { email: email },
    });
  }

  async getCandidates(query: CandidateQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [candidates, totalCount] = await Promise.all([
      this.prismaService.candidates.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.candidates.count({
        where: whereClause,
      }),
    ]);

    return {
      candidates,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findOne(id: string) {
    return this.getCandidateById(id);
  }

  async update(candidateId: string, data: UpdateCandidateDto) {
    const candidate = await this.getCandidateById(candidateId);

    if (!candidate) {
      throw new NotFoundException(
        `No candidate found with this id:${candidateId}`,
      );
    }

    const updatedCandidate = await this.prismaService.candidates.update({
      where: { id: candidateId },
      data: data,
    });

    return { updatedCandidate };
  }

  async completeIntake(userId: string) {
    // ... intake completion logic ...
    this.eventEmitter.emit('intake_complete', new IntakeCompleteEvent(userId));
  }

  async jobApplyClickedNoConfirm(userId: string, jobId: string) {
    this.eventEmitter.emit('job.apply_clicked_no_confirm', new JobApplyClickedNoConfirmEvent(userId, jobId));
  }
}
