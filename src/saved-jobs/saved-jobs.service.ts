import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedJob, SavedJobDocument } from './saved-job.schema';
import { Job, JobDocument } from '../jobs/jobs.schema';

@Injectable()
export class SavedJobsService {
  constructor(
    @InjectModel(SavedJob.name)
    private readonly savedJobModel: Model<SavedJobDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
  ) {}

  async saveJob(userId: string, jobId: string, notes?: string) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    try {
      const saved = await this.savedJobModel.create({
        user: new Types.ObjectId(userId),
        job: new Types.ObjectId(jobId),
        notes,
      });
      return {
        message: 'Job saved successfully',
        savedJob: saved,
      };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('Job is already in saved list');
      }
      throw err;
    }
  }

  async unsaveJob(userId: string, jobId: string) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid job ID');
    }

    const res = await this.savedJobModel.findOneAndDelete({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
    }).exec();

    if (!res) {
      throw new NotFoundException('Saved job record not found');
    }

    return { message: 'Job removed from saved list' };
  }

  async getUserSavedJobs(userId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);

    const [savedJobs, total] = await Promise.all([
      this.savedJobModel
        .find({ user: new Types.ObjectId(userId) })
        .populate({
          path: 'job',
          populate: { path: 'company', select: 'name logo slogan city address' },
        })
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
      this.savedJobModel.countDocuments({ user: new Types.ObjectId(userId) }),
    ]);

    return {
      savedJobs,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async checkIsSaved(userId: string, jobId: string): Promise<{ isSaved: boolean }> {
    if (!Types.ObjectId.isValid(jobId)) {
      return { isSaved: false };
    }

    const count = await this.savedJobModel.countDocuments({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
    });

    return { isSaved: count > 0 };
  }
}
