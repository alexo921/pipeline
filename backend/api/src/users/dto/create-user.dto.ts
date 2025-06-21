import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Role } from 'src/common/enums/enums';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

} 
