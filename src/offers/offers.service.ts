import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './offer.schema';
import { ApplyJob, ApplyJobDocument } from '../applyJobs/applyJobs.schema';
import { Job, JobDocument } from '../jobs/jobs.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(ApplyJob.name)
    private readonly applyJobModel: Model<ApplyJobDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOfferDto, companyId: string): Promise<Offer> {
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
        'You are not authorized to extend offers for this application',
      );
    }

    const offer = await this.offerModel.create({
      application: application._id,
      job: job._id,
      candidate: new Types.ObjectId(application.userId),
      company: new Types.ObjectId(companyId),
      salary: dto.salary,
      currency: dto.currency || 'USD',
      startDate: new Date(dto.startDate),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      benefits: dto.benefits || [],
      notes: dto.notes,
      status: 'pending',
    });

    // Update application stage to 'offer'
    application.status = 'offer';
    application.stageHistory.push({
      stage: 'offer',
      changedBy: companyId,
      changedByRole: 'company',
      note: `Formal job offer extended (Salary: ${dto.currency || 'USD'} ${dto.salary})`,
      changedAt: new Date(),
    });
    await application.save();

    // Notify candidate
    this.notificationsService
      .create({
        recipient: application.userId,
        recipientRole: 'user',
        title: 'Job Offer Received!',
        message: `Congratulations! ${job.title} offer extended by company.`,
        type: 'application_status',
        link: `/profile/offers`,
      })
      .catch(() => {});

    return offer;
  }

  async getMyOffers(actorId: string, actorRole: string): Promise<Offer[]> {
    const filter =
      actorRole === 'company'
        ? { company: new Types.ObjectId(actorId) }
        : { candidate: new Types.ObjectId(actorId) };

    return this.offerModel
      .find(filter)
      .populate('job', 'title location salary role')
      .populate('company', 'name logo city')
      .populate('candidate', 'name fullname email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, actorId: string, actorRole: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    const offer = await this.offerModel
      .findById(id)
      .populate('job', 'title location salary role')
      .populate('company', 'name logo city address')
      .populate('candidate', 'name fullname email phone profileImg')
      .exec();

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (
      actorRole !== 'admin' &&
      offer.company.toString() !== actorId &&
      offer.candidate.toString() !== actorId
    ) {
      throw new ForbiddenException('Unauthorized to view this offer');
    }

    return offer;
  }

  async respond(
    id: string,
    dto: RespondOfferDto,
    candidateId: string,
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    const offer = await this.offerModel.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.candidate.toString() !== candidateId) {
      throw new ForbiddenException('Only the candidate can respond to this offer');
    }

    if (offer.status !== 'pending') {
      throw new BadRequestException(`Offer has already been ${offer.status}`);
    }

    offer.status = dto.response;
    offer.candidateResponseNote = dto.note;
    offer.respondedAt = new Date();
    await offer.save();

    // If accepted, set application stage to 'hired'
    const application = await this.applyJobModel.findById(offer.application);
    if (application) {
      const newStage = dto.response === 'accepted' ? 'hired' : 'rejected';
      application.status = newStage;
      application.stageHistory.push({
        stage: newStage,
        changedBy: candidateId,
        changedByRole: 'user',
        note: `Candidate ${dto.response} the formal offer. ${dto.note ? `Note: ${dto.note}` : ''}`,
        changedAt: new Date(),
      });
      await application.save();
    }

    // Notify company
    const job = await this.jobModel.findById(offer.job);
    this.notificationsService
      .create({
        recipient: offer.company.toString(),
        recipientRole: 'company',
        title: `Offer ${dto.response.toUpperCase()}`,
        message: `Candidate has ${dto.response} the offer for ${job?.title || 'the position'}.`,
        type: 'application_status',
        link: `/company/postedjobs`,
      })
      .catch(() => {});

    return offer;
  }

  async rescind(id: string, companyId: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    const offer = await this.offerModel.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.company.toString() !== companyId) {
      throw new ForbiddenException('Only the offering company can rescind this offer');
    }

    if (offer.status !== 'pending') {
      throw new BadRequestException(`Cannot rescind an offer that is ${offer.status}`);
    }

    offer.status = 'rescinded';
    await offer.save();

    this.notificationsService
      .create({
        recipient: offer.candidate.toString(),
        recipientRole: 'user',
        title: 'Offer Rescinded',
        message: 'A previously extended job offer has been rescinded by the employer.',
        type: 'application_status',
        link: `/profile/offers`,
      })
      .catch(() => {});

    return offer;
  }
}
