import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JobQueryDto } from './dto/job-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewJobPostedNearZipEvent } from '../events/user-events';

@Injectable()
export class JobService {
  constructor(private readonly prismaService: PrismaService, private eventEmitter: EventEmitter2) {}

  /**
   * Extract ZIP code from location string or return null if not found
   * Handles formats like "Austin, TX 78701", "New York, NY", "78701", etc.
   */
  private extractZipCode(location: string): string | null {
    if (!location) return null;
    
    // Try to find ZIP code pattern (5 digits)
    const zipMatch = location.match(/\b\d{5}\b/);
    if (zipMatch) {
      return zipMatch[0];
    }
    
    // If no ZIP found, return null (will use city-based matching)
    return null;
  }

  /**
   * Extract city name from location string
   * Handles formats like "Austin, TX", "New York, NY 10001", etc.
   */
  private extractCity(location: string): string {
    if (!location) return '';
    
    // Extract city name (everything before the first comma)
    const cityMatch = location.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : location;
  }

  /**
   * Get candidates within a reasonable distance of a job location
   * Uses ZIP code matching if available, otherwise uses city-based matching
   */
  private async findNearbyCandidates(jobLocation: string, jobZipCode?: string): Promise<any[]> {
    if (!jobLocation) return [];

    // First try to use the job's zipCode if available
    if (jobZipCode) {
      const candidates = await this.prismaService.candidates.findMany({
        where: { zipCode: jobZipCode },
        include: { user: true }
      });
      if (candidates.length > 0) {
        return candidates;
      }
    }

    // Extract ZIP code from location string if not provided
    const extractedZipCode = this.extractZipCode(jobLocation);
    
    if (extractedZipCode) {
      // If we have a ZIP code, find candidates with the same ZIP
      return await this.prismaService.candidates.findMany({
        where: { zipCode: extractedZipCode },
        include: { user: true }
      });
    } else {
      // If no ZIP code, find candidates in the same city/state
      const city = this.extractCity(jobLocation);
      
      // For now, return all candidates (in production, you'd want a more sophisticated
      // location matching system with geocoding and distance calculations)
      return await this.prismaService.candidates.findMany({
        where: {
          OR: [
            { zipCode: { contains: city, mode: 'insensitive' } },
            { address: { contains: city, mode: 'insensitive' } }
          ]
        },
        include: { user: true }
      });
    }
  }

  async create(jobData: any) {
    const job = await this.prismaService.jobs.create({ data: jobData });
    
    // Find candidates near the job location (only if location exists)
    if (job.location) {
      const jobWithZipCode = job as any; // Type assertion for zipCode field
      const nearbyCandidates = await this.findNearbyCandidates(job.location, jobWithZipCode.zipCode || undefined);
      
      // Emit events for nearby candidates
      for (const candidate of nearbyCandidates) {
        this.eventEmitter.emit('new_job_posted_near_zip', new NewJobPostedNearZipEvent(candidate.userId, job.id));
      }
    }
    
    return job;
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

  async findOne(id: string) {
    const result = await this.prismaService.jobs.findUnique({
      where: { id },
    });

    if(!result){
      throw new NotFoundException(`No job found with id: ${id}`)
    }

    return result;
  }
}
