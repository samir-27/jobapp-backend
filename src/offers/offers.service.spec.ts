import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OffersService } from './offers.service';
import { Offer } from './offer.schema';
import { ApplyJob } from '../applyJobs/applyJobs.schema';
import { Job } from '../jobs/jobs.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('OffersService', () => {
  let service: OffersService;
  let mockOfferModel: any;
  let mockApplyJobModel: any;
  let mockJobModel: any;
  let mockNotificationsService: any;

  const validCompanyId = new Types.ObjectId().toString();
  const otherCompanyId = new Types.ObjectId().toString();
  const validCandidateId = new Types.ObjectId().toString();
  const validAppId = new Types.ObjectId().toString();
  const validJobId = new Types.ObjectId().toString();
  const validOfferId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockOfferModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    mockApplyJobModel = {
      findById: jest.fn(),
    };

    mockJobModel = {
      findById: jest.fn(),
    };

    mockNotificationsService = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getModelToken(Offer.name), useValue: mockOfferModel },
        { provide: getModelToken(ApplyJob.name), useValue: mockApplyJobModel },
        { provide: getModelToken(Job.name), useValue: mockJobModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  describe('create', () => {
    it('throws ForbiddenException if company does not own the job', async () => {
      mockApplyJobModel.findById.mockResolvedValue({
        _id: validAppId,
        jobId: validJobId,
        userId: validCandidateId,
        status: 'interview',
        stageHistory: [],
      });
      mockJobModel.findById.mockResolvedValue({
        _id: validJobId,
        company: new Types.ObjectId(otherCompanyId),
        title: 'Backend Engineer',
      });

      await expect(
        service.create(
          {
            applicationId: validAppId,
            salary: 120000,
            startDate: new Date().toISOString(),
          },
          validCompanyId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates offer and transitions application to offer stage', async () => {
      const mockAppDoc = {
        _id: validAppId,
        jobId: validJobId,
        userId: validCandidateId,
        status: 'interview',
        stageHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockApplyJobModel.findById.mockResolvedValue(mockAppDoc);
      mockJobModel.findById.mockResolvedValue({
        _id: validJobId,
        company: new Types.ObjectId(validCompanyId),
        title: 'Backend Engineer',
      });

      mockOfferModel.create.mockResolvedValue({
        _id: validOfferId,
        status: 'pending',
        salary: 120000,
      });

      const res = await service.create(
        {
          applicationId: validAppId,
          salary: 120000,
          startDate: new Date().toISOString(),
        },
        validCompanyId,
      );

      expect(res.status).toBe('pending');
      expect(mockAppDoc.status).toBe('offer');
      expect(mockAppDoc.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('respond', () => {
    it('throws ForbiddenException if actor is not the candidate', async () => {
      mockOfferModel.findById.mockResolvedValue({
        _id: validOfferId,
        candidate: new Types.ObjectId(validCandidateId),
        status: 'pending',
      });

      await expect(
        service.respond(
          validOfferId,
          { response: 'accepted' },
          'someone-else',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('transitions to hired when candidate accepts offer', async () => {
      const mockOfferDoc = {
        _id: validOfferId,
        candidate: new Types.ObjectId(validCandidateId),
        company: new Types.ObjectId(validCompanyId),
        job: new Types.ObjectId(validJobId),
        application: new Types.ObjectId(validAppId),
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockAppDoc = {
        _id: validAppId,
        status: 'offer',
        stageHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockOfferModel.findById.mockResolvedValue(mockOfferDoc);
      mockApplyJobModel.findById.mockResolvedValue(mockAppDoc);
      mockJobModel.findById.mockResolvedValue({ title: 'Lead Engineer' });

      const res = await service.respond(
        validOfferId,
        { response: 'accepted', note: 'Excited to join!' },
        validCandidateId,
      );

      expect(mockOfferDoc.status).toBe('accepted');
      expect(mockAppDoc.status).toBe('hired');
      expect(mockAppDoc.save).toHaveBeenCalled();
      expect(res.status).toBe('accepted');
    });
  });

  describe('rescind', () => {
    it('throws ForbiddenException if company does not own the offer', async () => {
      mockOfferModel.findById.mockResolvedValue({
        _id: validOfferId,
        company: new Types.ObjectId(otherCompanyId),
        status: 'pending',
      });

      await expect(
        service.rescind(validOfferId, validCompanyId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rescinds offer successfully', async () => {
      const mockOfferDoc = {
        _id: validOfferId,
        company: new Types.ObjectId(validCompanyId),
        candidate: new Types.ObjectId(validCandidateId),
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      mockOfferModel.findById.mockResolvedValue(mockOfferDoc);

      const res = await service.rescind(validOfferId, validCompanyId);
      expect(mockOfferDoc.status).toBe('rescinded');
      expect(res.status).toBe('rescinded');
    });
  });
});
