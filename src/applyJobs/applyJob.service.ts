import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApplyJob, ApplyJobDocument } from './applyJobs.schema';
import { User } from '../users/users.schema';
import { Job } from '../jobs/jobs.schema';
import { JobSeekerProfile, ProfileDocument } from '../profiles/profile.schema';
import { CreateApplyJobDto } from './dto/create-apply-job.dto';
import { UpdateApplicationStageDto } from './dto/update-stage.dto';
import { AddCandidateNoteDto } from './dto/add-candidate-note.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplyJobService {
  constructor(
    @InjectModel(ApplyJob.name) private applyJobModel: Model<ApplyJobDocument>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(JobSeekerProfile.name) private profileModel: Model<ProfileDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    data: CreateApplyJobDto,
    candidateUserId: string,
    file?: Express.Multer.File,
  ): Promise<ApplyJob> {
    if (!Types.ObjectId.isValid(candidateUserId)) {
      throw new BadRequestException('Invalid candidate user ID');
    }
    if (!Types.ObjectId.isValid(data.jobId)) {
      throw new BadRequestException('Invalid job ID');
    }

    const user = await this.userModel.findById(candidateUserId);
    if (!user) {
      throw new NotFoundException('Candidate user not found');
    }

    const job = await this.jobModel.findById(data.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const existingApplication = await this.applyJobModel.findOne({
      userId: candidateUserId,
      jobId: data.jobId,
    });
    if (existingApplication) {
      throw new BadRequestException('You have already applied for this job.');
    }

    const fullname = data.fullname || data.fullName || user.fullname || user.name;
    let resumeUrl = file ? file.path : data.resumeUrl || null;

    if (!resumeUrl) {
      const candidateProfile = await this.profileModel.findOne({
        user: new Types.ObjectId(candidateUserId),
      });
      if (candidateProfile?.resumeUrl) {
        resumeUrl = candidateProfile.resumeUrl;
      }
    }

    const jobApplication = new this.applyJobModel({
      fullname,
      phone: data.phone,
      description: data.description || '',
      education: data.education,
      course: data.course,
      profileImg: data.profileImg || user.profileImg,
      userId: candidateUserId,
      jobId: data.jobId,
      resumeUrl,
      status: 'applied',
      stageHistory: [
        {
          stage: 'applied',
          changedBy: candidateUserId,
          changedByRole: 'user',
          note: 'Application submitted',
          changedAt: new Date(),
        },
      ],
    });

    try {
      await jobApplication.save();
    } catch (err: any) {
      if (err.code === 11000) {
        throw new BadRequestException('You have already applied for this job.');
      }
      throw err;
    }

    try {
      // Bounded atomic metric increment
      await this.jobModel.findByIdAndUpdate(data.jobId, {
        $inc: { applicantsCount: 1 },
      });

      // Notify company of new applicant
      this.notificationsService
        .create({
          recipient: job.company.toString(),
          recipientRole: 'company',
          title: 'New Applicant Received',
          message: `${fullname} has applied for ${job.title}`,
          type: 'new_applicant',
          link: `/company/postedjobs`,
        })
        .catch(() => {});
    } catch (err) {
      await this.applyJobModel.findByIdAndDelete(jobApplication._id);
      throw err;
    }

    return jobApplication;
  }

  async findByUser(
    userId: string,
    actorId: string,
    actorRole: string,
  ): Promise<any[]> {
    if (actorRole !== 'admin' && actorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view another user’s applications',
      );
    }

    const applications = await this.applyJobModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const jobIds = [...new Set(applications.map((a) => a.jobId))];
    const jobs = await this.jobModel
      .find({ _id: { $in: jobIds } })
      .populate('company', 'name logo city address')
      .lean()
      .exec();

    const jobsMap = new Map(jobs.map((j) => [j._id.toString(), j]));

    return applications.map((app) => ({
      ...app,
      job: jobsMap.get(app.jobId.toString()) || null,
    }));
  }

  async findByJob(
    jobId: string,
    actorId: string,
    actorRole: string,
  ): Promise<ApplyJob[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException(
        'You are not authorized to view applicants for this job',
      );
    }

    return this.applyJobModel.find({ jobId }).sort({ createdAt: -1 }).exec();
  }

  async getResume(
    applicationId: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ resumeUrl: string }> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!application.resumeUrl) {
      throw new NotFoundException('No resume uploaded for this application');
    }

    if (actorRole === 'admin' || application.userId.toString() === actorId) {
      return { resumeUrl: application.resumeUrl };
    }

    const job = await this.jobModel.findById(application.jobId);
    if (job && job.company.toString() === actorId) {
      return { resumeUrl: application.resumeUrl };
    }

    throw new ForbiddenException('You are not authorized to access this resume');
  }

  // ── Candidate Application Withdrawal ─────────────────────────────────────────

  async withdraw(
    applicationId: string,
    candidateUserId: string,
  ): Promise<ApplyJob> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.userId.toString() !== candidateUserId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    if (['withdrawn', 'hired', 'rejected'].includes(application.status)) {
      throw new BadRequestException(
        `Cannot withdraw an application that is already ${application.status}`,
      );
    }

    application.status = 'withdrawn';
    application.stageHistory.push({
      stage: 'withdrawn',
      changedBy: candidateUserId,
      changedByRole: 'user',
      note: 'Candidate withdrew application',
      changedAt: new Date(),
    });

    await application.save();

    await this.jobModel.findByIdAndUpdate(application.jobId, {
      $inc: { applicantsCount: -1 },
    });

    const job = await this.jobModel.findById(application.jobId);
    if (job) {
      this.notificationsService
        .create({
          recipient: job.company.toString(),
          recipientRole: 'company',
          title: 'Application Withdrawn',
          message: `${application.fullname} has withdrawn their application for ${job.title}.`,
          type: 'application_status',
          link: `/company/postedjobs`,
        })
        .catch(() => {});
    }

    return application;
  }

  // ── Phase 3 Pipeline Management ──────────────────────────────────────────────

  async updateStage(
    applicationId: string,
    dto: UpdateApplicationStageDto,
    actorId: string,
    actorRole: string,
  ): Promise<ApplyJob> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobModel.findById(application.jobId);
    if (!job) {
      throw new NotFoundException('Associated job not found');
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException(
        'You do not have permission to manage this applicant',
      );
    }

    application.status = dto.stage;
    application.stageHistory.push({
      stage: dto.stage,
      changedBy: actorId,
      changedByRole: actorRole,
      note: dto.note,
      changedAt: new Date(),
    });

    await application.save();

    this.notificationsService
      .create({
        recipient: application.userId,
        recipientRole: 'user',
        title: 'Application Status Updated',
        message: `Your application for ${job.title} has moved to ${dto.stage.toUpperCase()}.`,
        type: 'application_status',
        link: `/profile/appliedjobs`,
      })
      .catch(() => {});

    return application;
  }

  async addNote(
    applicationId: string,
    dto: AddCandidateNoteDto,
    actorId: string,
    actorName: string,
    actorRole: string,
  ): Promise<ApplyJob> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobModel.findById(application.jobId);
    if (!job) {
      throw new NotFoundException('Associated job not found');
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException('Unauthorized to add notes to this application');
    }

    application.notes.push({
      authorId: actorId,
      authorName: actorName || 'Recruiter',
      content: dto.content,
      createdAt: new Date(),
    });

    await application.save();
    return application;
  }

  async rateCandidate(
    applicationId: string,
    rating: number,
    actorId: string,
    actorRole: string,
  ): Promise<ApplyJob> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobModel.findById(application.jobId);
    if (!job) {
      throw new NotFoundException('Associated job not found');
    }

    if (actorRole !== 'admin' && job.company.toString() !== actorId) {
      throw new ForbiddenException('Unauthorized to rate this candidate');
    }

    application.rating = rating;
    await application.save();
    return application;
  }
}
