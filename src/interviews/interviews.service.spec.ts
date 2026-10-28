import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InterviewsService } from './interviews.service';
import { Interview } from './interview.schema';
import { ApplyJob } from '../applyJobs/applyJobs.schema';
import { Job } from '../jobs/jobs.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let mockInterviewModel: any;
  let mockApplyJobModel: any;
  let mockJobModel: any;
  let mockNotificationsService: any;

  const validCompanyId = new Types.ObjectId().toString();
  const otherCompanyId = new Types.ObjectId().toString();
  const validCandidateId = new Types.ObjectId().toString();
  const validAppId = new Types.ObjectId().toString();
  const validJobId = new Types.ObjectId().toString();
  const validInterviewId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockInterviewModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
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
        InterviewsService,
        { provide: getModelToken(Interview.name), useValue: mockInterviewModel },
        { provide: getModelToken(ApplyJob.name), useValue: mockApplyJobModel },
        { provide: getModelToken(Job.name), useValue: mockJobModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
  });

  describe('schedule', () => {
    it('throws ForbiddenException if company does not own the job', async () => {
      mockApplyJobModel.findById.mockResolvedValue({
        _id: validAppId,
        jobId: validJobId,
        userId: validCandidateId,
        status: 'applied',
        stageHistory: [],
      });
      mockJobModel.findById.mockResolvedValue({
        _id: validJobId,
        company: new Types.ObjectId(otherCompanyId),
        title: 'Backend Dev',
      });

      await expect(
        service.schedule(
          {
            applicationId: validAppId,
            title: 'Technical Screen',
            scheduledAt: new Date().toISOString(),
          },
          validCompanyId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('schedules interview and updates application stage to interview', async () => {
      const mockAppDoc = {
        _id: validAppId,
        jobId: validJobId,
        userId: validCandidateId,
        status: 'applied',
        stageHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockApplyJobModel.findById.mockResolvedValue(mockAppDoc);
      mockJobModel.findById.mockResolvedValue({
        _id: validJobId,
        company: new Types.ObjectId(validCompanyId),
        title: 'Backend Dev',
      });

      mockInterviewModel.create.mockResolvedValue({
        _id: validInterviewId,
        title: 'Technical Screen',
        status: 'scheduled',
      });

      const res = await service.schedule(
        {
          applicationId: validAppId,
          title: 'Technical Screen',
          scheduledAt: new Date().toISOString(),
        },
        validCompanyId,
      );

      expect(res.status).toBe('scheduled');
      expect(mockAppDoc.status).toBe('interview');
      expect(mockAppDoc.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('allows cancelling by authorized company or candidate', async () => {
      const mockInterviewDoc = {
        _id: validInterviewId,
        title: 'Interview 1',
        company: new Types.ObjectId(validCompanyId),
        candidate: new Types.ObjectId(validCandidateId),
        status: 'scheduled',
        save: jest.fn().mockResolvedValue(true),
      };

      mockInterviewModel.findById.mockResolvedValue(mockInterviewDoc);

      const res = await service.cancel(validInterviewId, validCompanyId, 'company');
      expect(mockInterviewDoc.status).toBe('cancelled');
      expect(res.message).toBe('Interview cancelled successfully');
    });

    it('throws ForbiddenException if unauthorized user tries to cancel', async () => {
      const mockInterviewDoc = {
        _id: validInterviewId,
        company: new Types.ObjectId(validCompanyId),
        candidate: new Types.ObjectId(validCandidateId),
      };

      mockInterviewModel.findById.mockResolvedValue(mockInterviewDoc);

      await expect(
        service.cancel(validInterviewId, 'unauthorized-user', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
