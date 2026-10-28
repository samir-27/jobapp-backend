import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
