import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    const project = await this.prismaService.projects.create({
      data: createProjectDto,
    });
    return project;
  }

  async findAll() {
    return this.prismaService.projects.findMany();
  }

  async findOne(id: string) {
    const project = await this.prismaService.projects.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    await this.prismaService.projects.update({
      where: { id },
      data: updateProjectDto,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const project = await this.findOne(id);
    return this.prismaService.projects.delete({
      where: { id },
    });
  }
}
