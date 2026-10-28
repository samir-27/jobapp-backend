import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsEnum(['user', 'company'])
  accountType?: 'user' | 'company';
}
