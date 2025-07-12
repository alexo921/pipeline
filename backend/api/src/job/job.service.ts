import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JobQueryDto } from './dto/job-query.dto';

@Injectable()
export class JobService {
  constructor(private readonly prismaService: PrismaService) {}

  async create() {
    const jobData = {
      title: 'Home Health Aide/HHA',
      company: 'BrightStar Care',
      location: 'Melbourne, FL',
      description:
        'CompetitiveMelbourne,FL32940CNACHHAPart TimeDay ShiftWeekdayWeekendJOB DESCRIPTIONHome Health Aide / HHA...',
      salary: 'Competitive',
      requirements: 'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
      benefits: 'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
      status: 'active',
    };

    return await this.prismaService.jobs.create({ data: jobData });
  }

  async findAll(query: JobQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prismaService.jobs.findMany({
        where: query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { company: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.jobs.count({
        where: query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { company: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
      }),
    ]);

    return {
      jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  // TODO : find one needed
  async findOne(id: string) {
    const result = await this.prismaService.jobs.findUnique({
      where: { id },
    });

    if(!result){
      throw new NotFoundException(`No job found with id: ${id}`)
    }

    return result; // Optionally return the result if needed
  }

  // update(id: number, updateJobDto: UpdateJobDto) {
  //   return `This action updates a #${id} job`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} job`;
  // }
}
