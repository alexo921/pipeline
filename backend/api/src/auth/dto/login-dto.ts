import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'brian@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'qwerty123' })
  @IsString()
  password: string;
}
