import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobSeekerProfile, ProfileDocument } from './profile.schema';
import { User, UserDocument } from '../users/users.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(JobSeekerProfile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getMyProfile(userId: string): Promise<JobSeekerProfile> {
    let profile = await this.profileModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('user', 'name fullname email phone address city state profileImg education course')
      .exec();

    if (!profile) {
      // Auto-create on first fetch
      profile = await this.profileModel.create({
        user: new Types.ObjectId(userId),
      });
      profile = await profile.populate(
        'user',
        'name fullname email phone address city state profileImg education course',
      );
    }

    return profile;
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<JobSeekerProfile> {
    const profile = await this.profileModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true, upsert: true, runValidators: true },
    ).populate('user', 'name fullname email phone address city state profileImg education course');

    return profile;
  }

  async getProfileByUserId(
    targetUserId: string,
    requesterRole?: string,
  ): Promise<JobSeekerProfile> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const profile = await this.profileModel
      .findOne({ user: new Types.ObjectId(targetUserId) })
      .populate('user', 'name fullname email phone address city state profileImg education course')
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // If profile is not public, only company or admin can view
    if (!profile.isPublic && requesterRole !== 'admin' && requesterRole !== 'company') {
      throw new ForbiddenException('This candidate profile is private');
    }

    return profile;
  }

  async updateResume(userId: string, url: string, originalName?: string) {
    return this.profileModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      {
        $set: {
          resumeUrl: url,
          ...(originalName ? { resumeOriginalName: originalName } : {}),
        },
      },
      { new: true, upsert: true },
    );
  }
}
