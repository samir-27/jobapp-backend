import { IsEmail, IsEnum, MaxLength } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsEnum(['user', 'company'])
  accountType: 'user' | 'company';
}
