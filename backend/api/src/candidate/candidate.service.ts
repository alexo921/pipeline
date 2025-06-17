import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

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
}
