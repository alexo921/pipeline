import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-list-query.dto';

@Injectable()
export class CandidateService {
  constructor(private readonly prismaService: PrismaService) {}

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

  async findAll(query: CandidateQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [candidates, total] = await Promise.all([
      this.prismaService.candidates.findMany({
        where: query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          experience: true,
        },
      }),
      this.prismaService.candidates.count({
        where: query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
      }),
    ]);

    return {
      candidates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
}
