import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument, JobStatus } from './jobs.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { JobSeekerProfile, ProfileDocument } from '../profiles/profile.schema';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(JobSeekerProfile.name)
    private profileModel: Model<ProfileDocument>,
  ) {}

  async createJob(createJobDto: CreateJobDto, companyId: string): Promise<Job> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    const jobData = { ...createJobDto };
    delete jobData.companyName;

    const newJob = new this.jobModel({
      ...jobData,
      company: new Types.ObjectId(companyId),
      status: jobData.status || 'draft',
      viewsCount: 0,
      applicantsCount: 0,
    });
    return newJob.save();
  }

  async findAll(filters: JobQueryDto): Promise<Job[]> {
    const query: any = {};

    // By default, public browse shows only 'published' jobs
    query.status = { $in: ['published', null] };

    if (filters.title && filters.title.trim()) {
      query.title = { $regex: escapeRegex(filters.title.trim()), $options: 'i' };
    }
    if (filters.role && filters.role.trim()) {
      query.role = { $regex: escapeRegex(filters.role.trim()), $options: 'i' };
    }
    if (filters.location && filters.location.trim()) {
      query.location = filters.location.trim();
    }
    if (filters.jobType && filters.jobType.trim()) {
      query.jobType = filters.jobType.trim();
    }
    if (filters.experience && filters.experience.trim()) {
      query.experience = filters.experience.trim();
    }
    if (filters.salary) {
      query.salary = { $gte: Number(filters.salary) };
    }
    if (filters.skills && filters.skills.trim()) {
      const skillsArray = filters.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsArray.length > 0) {
        query.skills = {
          $in: skillsArray.map((skill) => new RegExp(escapeRegex(skill), 'i')),
        };
      }
    }

    let sortOption: any = { createdAt: -1 };
    if (filters.sortBy) {
      switch (filters.sortBy.toLowerCase()) {
        case 'salary':
        case 'salary_asc':
          sortOption = { salary: 1 };
          break;
        case 'salary_desc':
          sortOption = { salary: -1 };
          break;
        case 'oldest':
        case 'posteddate_asc':
          sortOption = { postedDate: 1, createdAt: 1 };
          break;
        case 'newest':
        case 'date':
        case 'posteddate':
        case 'posteddate_desc':
          sortOption = { postedDate: -1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(Math.max(1, Number(filters.limit) || 50), 100);

    return this.jobModel
      .find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('company', 'name logo city address')
      .exec();
  }

  async findJobsByCompany(companyId: string): Promise<Job[]> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    return this.jobModel
      .find({ company: companyId })
      .populate('company', 'name logo city address')
      .exec();
  }

  async findOne(id: string): Promise<Job> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }
    const job = await this.jobModel
      .findById(id)
      .populate('company', 'name logo city address slogan')
      .exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async recordView(id: string): Promise<{ viewsCount: number }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }
    const updated = await this.jobModel.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Job not found');
    }
    return { viewsCount: updated.viewsCount || 1 };
  }

  async updateJob(
    id: string,
    updateJobDto: UpdateJobDto,
    actorId: string,
    actorRole: string,
  ): Promise<Job> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException('You are not authorized to update this job');
    }

    const cleanUpdate = { ...updateJobDto };
    delete cleanUpdate.companyName;

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(id, { $set: cleanUpdate }, { new: true, runValidators: true })
      .populate('company', 'name logo')
      .exec();

    if (!updatedJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return updatedJob;
  }

  async updateJobStatus(
    id: string,
    status: JobStatus,
    actorId: string,
    actorRole: string,
  ): Promise<Job> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException('You are not authorized to change status of this job');
    }

    job.status = status;
    return job.save();
  }

  async deleteJob(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException('You are not authorized to delete this job');
    }

    await this.jobModel.findByIdAndDelete(id).exec();
    return { deleted: true, message: 'Job deleted successfully' };
  }

  // ── Matching Engine: Score jobs for a candidate ──────────────────────────────
  async getRecommendations(candidateUserId: string, limit = 10): Promise<any[]> {
    const profile = await this.profileModel.findOne({
      user: new Types.ObjectId(candidateUserId),
    });

    const activeJobs = await this.jobModel
      .find({ status: { $in: ['published', null] } })
      .populate('company', 'name logo city')
      .limit(50)
      .exec();

    if (!profile || (!profile.skills?.length && !profile.preferredRoles?.length)) {
      return activeJobs.slice(0, limit).map((job) => ({
        job,
        matchScore: 50,
        matchingSkills: [],
      }));
    }

    const candidateSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const preferredRoles = (profile.preferredRoles || []).map((r) => r.toLowerCase());

    const scored = activeJobs.map((job) => {
      let score = 0;
      const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
      const matchingSkills: string[] = [];

      // Skills match (up to 50 points)
      jobSkills.forEach((skill) => {
        if (candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))) {
          matchingSkills.push(skill);
          score += 15;
        }
      });
      score = Math.min(score, 50);

      // Role match (up to 25 points)
      const jobRole = (job.role || job.title || '').toLowerCase();
      if (preferredRoles.some((pr) => jobRole.includes(pr) || pr.includes(jobRole))) {
        score += 25;
      }

      // Work preference / Location match (up to 15 points)
      if (
        profile.workPreference === 'any' ||
        job.location?.toLowerCase() === profile.workPreference?.toLowerCase()
      ) {
        score += 15;
      }

      // Base activity score (10 points)
      score += 10;

      return {
        job,
        matchScore: Math.min(score, 100),
        matchingSkills,
      };
    });

    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }
}
