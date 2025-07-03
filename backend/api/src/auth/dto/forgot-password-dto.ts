import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPassDto {
  @ApiProperty({ example: 'brian@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
