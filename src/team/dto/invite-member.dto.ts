import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TeamRole } from '../team-member.schema';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(['admin', 'recruiter', 'hiring_manager'])
  role?: TeamRole;
}
