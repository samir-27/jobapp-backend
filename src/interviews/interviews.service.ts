import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from './interview.schema';
import { ApplyJob, ApplyJobDocument } from '../applyJobs/applyJobs.schema';
import { Job, JobDocument } from '../jobs/jobs.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,
    @InjectModel(ApplyJob.name)
    private readonly applyJobModel: Model<ApplyJobDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async schedule(
    dto: ScheduleInterviewDto,
    companyId: string,
  ): Promise<Interview> {
    if (!Types.ObjectId.isValid(dto.applicationId)) {
      throw new BadRequestException('Invalid application ID');
    }

    const application = await this.applyJobModel.findById(dto.applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobModel.findById(application.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.company.toString() !== companyId) {
      throw new ForbiddenException(
        'You are not authorized to schedule interviews for this application',
      );
    }

    const interview = await this.interviewModel.create({
      application: application._id,
      job: job._id,
      candidate: new Types.ObjectId(application.userId),
      company: new Types.ObjectId(companyId),
      title: dto.title,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes || 45,
      mode: dto.mode || 'remote',
      meetingLink: dto.meetingLink,
      location: dto.location,
      interviewers: dto.interviewers || [],
      notes: dto.notes,
      status: 'scheduled',
    });

    // Also update application stage to 'interview' if it's currently applied or screening
    if (['applied', 'screening'].includes(application.status)) {
      application.status = 'interview';
      application.stageHistory.push({
        stage: 'interview',
        changedBy: companyId,
        changedByRole: 'company',
        note: `Interview scheduled: ${dto.title}`,
        changedAt: new Date(),
      });
      await application.save();
    }

    // Notify candidate
    this.notificationsService
      .create({
        recipient: application.userId,
        recipientRole: 'user',
        title: 'Interview Scheduled',
        message: `An interview for ${job.title} has been scheduled on ${new Date(dto.scheduledAt).toLocaleString()}`,
        type: 'interview',
        link: `/profile/offers`,
      })
      .catch(() => {});

    return interview;
  }

  async findByCandidate(candidateId: string): Promise<Interview[]> {
    return this.interviewModel
      .find({ candidate: new Types.ObjectId(candidateId) })
      .populate('job', 'title location jobType role')
      .populate('company', 'name logo city')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findByCompany(companyId: string): Promise<Interview[]> {
    return this.interviewModel
      .find({ company: new Types.ObjectId(companyId) })
      .populate('job', 'title location')
      .populate('candidate', 'name fullname email phone profileImg')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findOne(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<Interview> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID');
    }

    const interview = await this.interviewModel
      .findById(id)
      .populate('job', 'title location salary role')
      .populate('company', 'name logo')
      .populate('candidate', 'name fullname email phone profileImg')
      .exec();

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (
      actorRole !== 'admin' &&
      interview.company.toString() !== actorId &&
      interview.candidate.toString() !== actorId
    ) {
      throw new ForbiddenException('Unauthorized to view this interview');
    }

    return interview;
  }

  async update(
    id: string,
    dto: UpdateInterviewDto,
    actorId: string,
    actorRole: string,
  ): Promise<Interview> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID');
    }

    const interview = await this.interviewModel.findById(id);
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (actorRole !== 'admin' && interview.company.toString() !== actorId) {
      throw new ForbiddenException('Only the organizing company can update this interview');
    }

    const updated = await this.interviewModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Interview not found');
    }

    if (dto.scheduledAt || dto.status) {
      // Notify candidate of update
      this.notificationsService
        .create({
          recipient: interview.candidate.toString(),
          recipientRole: 'user',
          title: 'Interview Details Updated',
          message: `Your interview for "${interview.title}" status is now ${updated.status}.`,
          type: 'interview',
          link: `/profile/offers`,
        })
        .catch(() => {});
    }

    return updated;
  }

  async cancel(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID');
    }

    const interview = await this.interviewModel.findById(id);
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (
      actorRole !== 'admin' &&
      interview.company.toString() !== actorId &&
      interview.candidate.toString() !== actorId
    ) {
      throw new ForbiddenException('Unauthorized to cancel this interview');
    }

    interview.status = 'cancelled';
    await interview.save();

    const targetRecipient =
      actorRole === 'company'
        ? interview.candidate.toString()
        : interview.company.toString();
    const targetRole = actorRole === 'company' ? 'user' : 'company';

    this.notificationsService
      .create({
        recipient: targetRecipient,
        recipientRole: targetRole,
        title: 'Interview Cancelled',
        message: `Interview "${interview.title}" was cancelled.`,
        type: 'interview',
        link: targetRole === 'company' ? `/company/postedjobs` : `/profile/offers`,
      })
      .catch(() => {});

    return { message: 'Interview cancelled successfully' };
  }
}
