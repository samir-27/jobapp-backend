import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeamMember, TeamMemberDocument, TeamRole } from './team-member.schema';
import { Company, CompanyDocument } from '../companies/companies.schema';
import { User, UserDocument } from '../users/users.schema';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamMember.name)
    private readonly teamMemberModel: Model<TeamMemberDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async invite(
    companyId: string,
    dto: InviteMemberDto,
    actorId: string,
  ): Promise<TeamMember> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const email = dto.email.toLowerCase();

    // Check if member already invited
    const existing = await this.teamMemberModel.findOne({
      company: new Types.ObjectId(companyId),
      email,
    });
    if (existing) {
      if (existing.status === 'revoked') {
        existing.status = 'pending';
        existing.role = dto.role || 'recruiter';
        return existing.save();
      }
      throw new ConflictException('This team member is already invited or active');
    }

    // Check if user already has an account
    const existingUser = await this.userModel.findOne({ email });

    const member = await this.teamMemberModel.create({
      company: new Types.ObjectId(companyId),
      user: existingUser ? existingUser._id : undefined,
      email,
      name: dto.name || (existingUser ? existingUser.fullname || existingUser.name : undefined),
      role: dto.role || 'recruiter',
      status: existingUser ? 'active' : 'pending',
      invitedBy: new Types.ObjectId(actorId),
    });

    return member;
  }

  async getTeam(companyId: string): Promise<TeamMember[]> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    return this.teamMemberModel
      .find({
        company: new Types.ObjectId(companyId),
        status: { $ne: 'revoked' },
      })
      .populate('user', 'name fullname email profileImg')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateRole(
    memberId: string,
    role: TeamRole,
    companyId: string,
  ): Promise<TeamMember> {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Invalid member ID');
    }

    const member = await this.teamMemberModel.findById(memberId);
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.company.toString() !== companyId) {
      throw new ForbiddenException('Unauthorized to modify this team member');
    }

    member.role = role;
    return member.save();
  }

  async remove(
    memberId: string,
    companyId: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Invalid member ID');
    }

    const member = await this.teamMemberModel.findById(memberId);
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.company.toString() !== companyId) {
      throw new ForbiddenException('Unauthorized to remove this team member');
    }

    member.status = 'revoked';
    await member.save();

    return { message: 'Team member removed successfully' };
  }
}
