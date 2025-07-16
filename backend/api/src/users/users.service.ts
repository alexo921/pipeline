import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountCreatedEvent, ReactivatedUserLoginEvent } from '../events/user-events';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService, private eventEmitter: EventEmitter2) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prismaService.users.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const user = await this.prismaService.users.create({
      data: createUserDto,
    });
    // Emit account created event
    this.eventEmitter.emit('account.created', new AccountCreatedEvent(user.id));
    return user;
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

  async handleReactivatedLogin(userId: string) {
    this.eventEmitter.emit('reactivated_user_login', new ReactivatedUserLoginEvent(userId));
  }
}
