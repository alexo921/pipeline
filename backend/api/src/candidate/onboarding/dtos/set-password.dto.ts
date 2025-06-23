import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPassword {
  @ApiProperty({
    description: 'JWT token sent to the user for password setup/reset',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password with a minimum length of 6 characters',
    example: 'newStrongPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
