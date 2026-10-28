import { IsEnum } from 'class-validator';
import { TeamRole } from '../team-member.schema';

export class UpdateMemberRoleDto {
  @IsEnum(['admin', 'recruiter', 'hiring_manager'])
  role: TeamRole;
}
