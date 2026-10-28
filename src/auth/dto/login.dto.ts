import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(['user', 'company', 'admin'])
  accountType?: 'user' | 'company' | 'admin';
}
