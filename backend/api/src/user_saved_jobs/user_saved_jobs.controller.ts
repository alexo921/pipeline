import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserSavedJobsService } from './user_saved_jobs.service';
import { CreateUserSavedJobDto } from './dto/create-user_saved_job.dto';
import { UpdateUserSavedJobDto } from './dto/update-user_saved_job.dto';

@Controller('user-saved-jobs')
export class UserSavedJobsController {
  constructor(private readonly userSavedJobsService: UserSavedJobsService) {}

  @Post()
  create() {
    return this.userSavedJobsService.create();
  }

  @Get()
  findAll() {
    return this.userSavedJobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userSavedJobsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserSavedJobDto: UpdateUserSavedJobDto,
  ) {
    return this.userSavedJobsService.update(+id, updateUserSavedJobDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userSavedJobsService.remove(+id);
  }
}
