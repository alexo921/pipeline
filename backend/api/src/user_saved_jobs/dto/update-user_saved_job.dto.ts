import { PartialType } from '@nestjs/swagger';
import { CreateUserSavedJobDto } from './create-user_saved_job.dto';

export class UpdateUserSavedJobDto extends PartialType(CreateUserSavedJobDto) {}
