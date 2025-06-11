import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prismaService: PrismaService, 
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    const task = await this.prismaService.tasks.create({
      data: createTaskDto,
    });
    return task;
  }

  async findAll() {
    return this.prismaService.tasks.findMany({
      include: {
        projects: true,
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prismaService.tasks.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);
    await this.prismaService.tasks.update({
      where: { id },
      data: updateTaskDto,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    return this.prismaService.tasks.delete({
      where: { id },
    });
  }
}
