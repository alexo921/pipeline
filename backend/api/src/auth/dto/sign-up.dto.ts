import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'brian lewis' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'brian@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'qwerty123' })
  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  role?: string;
}
