import { IsString, MinLength } from 'class-validator';
export class SetPassword {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
