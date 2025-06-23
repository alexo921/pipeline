import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Current user password',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password to be set',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
