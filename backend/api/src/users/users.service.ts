import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prismaService.users.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    return this.prismaService.users.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prismaService.users.findMany({
      include: { tasks: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prismaService.users.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.prismaService.users.update({
      where: { id },
      data: updateUserDto,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    return this.prismaService.users.delete({
      where: { id },
    });
  }
}
