import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Admin, AdminDocument } from './admin.schema';
import { User, UserDocument } from '../users/users.schema';
import { Company, CompanyDocument } from '../companies/companies.schema';
import { Job, JobDocument } from '../jobs/jobs.schema';
import { ApplyJob, ApplyJobDocument } from '../applyJobs/applyJobs.schema';
import { Interview, InterviewDocument } from '../interviews/interview.schema';
import { Offer, OfferDocument } from '../offers/offer.schema';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { getJwtSecret } from '../auth/jwt.config';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(ApplyJob.name) private applyJobModel: Model<ApplyJobDocument>,
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  async register(
    registerDto: AdminRegisterDto,
    actorRole?: string,
  ): Promise<{ message: string; admin: { id: string; email: string } }> {
    const adminCount = await this.adminModel.countDocuments();

    if (adminCount > 0 && actorRole !== 'admin') {
      const configuredBootstrap = process.env.ADMIN_BOOTSTRAP_SECRET;
      if (!configuredBootstrap || registerDto.bootstrapSecret !== configuredBootstrap) {
        throw new ForbiddenException(
          'Only an authorized administrator can register new admin accounts.',
        );
      }
    }

    const existing = await this.adminModel
      .findOne({ email: registerDto.email })
      .exec();
    if (existing) {
      throw new BadRequestException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newAdmin = new this.adminModel({
      email: registerDto.email,
      password: hashedPassword,
    });

    const saved = await newAdmin.save();
    return {
      message: 'Admin registered successfully',
      admin: {
        id: saved._id.toString(),
        email: saved.email,
      },
    };
  }

  async signIn(
    loginDto: AdminLoginDto,
  ): Promise<{ token: string; admin: { id: string; email: string } }> {
    const admin = await this.adminModel
      .findOne({ email: loginDto.email })
      .select('+password')
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        type: 'admin',
        role: 'admin',
        email: admin.email,
      },
      getJwtSecret(),
      { expiresIn: '1d' },
    );

    return {
      token,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
      },
    };
  }

  // ── Operational Analytics ───────────────────────────────────────────────────

  async getPlatformStats() {
    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      totalInterviews,
      totalOffers,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.companyModel.countDocuments(),
      this.jobModel.countDocuments(),
      this.jobModel.countDocuments({ status: 'published' }),
      this.applyJobModel.countDocuments(),
      this.interviewModel.countDocuments(),
      this.offerModel.countDocuments(),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      totalInterviews,
      totalOffers,
    };
  }

  // ── Moderation Controls ─────────────────────────────────────────────────────

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { accountStatus: status } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return { message: `User account status set to ${status}`, user };
  }

  async updateCompanyStatus(companyId: string, status: 'active' | 'suspended') {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findByIdAndUpdate(
      companyId,
      { $set: { accountStatus: status } },
      { new: true },
    );
    if (!company) throw new NotFoundException('Company not found');
    return { message: `Company account status set to ${status}`, company };
  }
}
