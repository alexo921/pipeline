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
      url: 'https://www.mycnajobs.com/job-listings/4194251/home-health-aide-hha.html?searchId=1750101598.6548&page=1',
      source: 'myCNAjobs',
      scrapedDate: new Date('2025-06-16'),
      postedDate: new Date('2025-05-15'),
      jobType: 'Part Time',
      duties: [
        'Provide client care according to approved Plan of Care',
        'Assist clients with personal care and hygiene',
        'Provide transportation as required',
        'Assist in providing a safe environment for client',
        'Comply with all documentation and record keeping',
      ],
      requirements: [
        'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
      ],
      benefits: [
        'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
      ],
      shift: 'Day Shift, Weekday, Weekend',
      city: 'Melbourne',
      state: 'FL',
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
        include: { company_details: true },
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
