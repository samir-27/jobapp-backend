import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplyJobService } from './applyJob.service';
import { ApplyJob } from './applyJobs.schema';
import { Job } from '../jobs/jobs.schema';
import { User } from '../users/users.schema';
import { JobSeekerProfile } from '../profiles/profile.schema';
import { Types } from 'mongoose';

import { NotificationsService } from '../notifications/notifications.service';

describe('ApplyJobService (Unit Tests)', () => {
  let service: ApplyJobService;
  let mockApplyJobModel: any;
  let mockJobModel: any;
  let mockUserModel: any;
  let mockProfileModel: any;

  const candidateId = new Types.ObjectId().toString();
  const otherCandidateId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const otherCompanyId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const applicationId = new Types.ObjectId().toString();

  const mockJob = {
    _id: jobId,
    title: 'Frontend Engineer',
    company: new Types.ObjectId(companyId),
  };

  const mockUser = {
    _id: candidateId,
    name: 'Jane Doe',
    email: 'jane@example.com',
    fullname: 'Jane Doe',
  };

  const mockApplication = {
    _id: applicationId,
    userId: candidateId,
    jobId: jobId,
    fullname: 'Jane Doe',
    phone: '1234567890',
    education: 'graduation',
    course: 'Computer Science',
    resumeUrl: 'https://cloudinary.com/resumes/resume-jane.pdf',
  };

  beforeEach(async () => {
    mockApplyJobModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: applicationId,
      save: jest.fn().mockResolvedValue({
        _id: applicationId,
        ...dto,
      }),
    }));

    mockApplyJobModel.findOne = jest.fn();
    mockApplyJobModel.findById = jest.fn();
    mockApplyJobModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockApplication]),
    });
    mockApplyJobModel.findByIdAndDelete = jest.fn().mockResolvedValue(true);

    mockJobModel = {
      findById: jest.fn().mockResolvedValue(mockJob),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockJob),
    };

    mockUserModel = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    };

    mockProfileModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyJobService,
        {
          provide: getModelToken(ApplyJob.name),
          useValue: mockApplyJobModel,
        },
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(JobSeekerProfile.name),
          useValue: mockProfileModel,
        },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<ApplyJobService>(ApplyJobService);
  });

  describe('create application integrity (DB-001)', () => {
    const validDto = {
      jobId,
      phone: '1234567890',
      education: 'graduation',
      course: 'CS',
      fullname: 'Jane Doe',
    };

    it('successfully creates application and updates references', async () => {
      mockApplyJobModel.findOne.mockResolvedValueOnce(null);
      const res = await service.create(validDto as any, candidateId);
      expect(res).toBeDefined();
      expect(mockJobModel.findByIdAndUpdate).toHaveBeenCalledWith(
        jobId,
        expect.objectContaining({
          $inc: { applicantsCount: 1 },
        }),
      );
    });

    it('rejects duplicate application when already applied (DB-001)', async () => {
      mockApplyJobModel.findOne.mockResolvedValueOnce(mockApplication);
      await expect(
        service.create(validDto as any, candidateId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when job does not exist', async () => {
      mockJobModel.findById.mockResolvedValueOnce(null);
      await expect(
        service.create(validDto as any, candidateId),
      ).rejects.toThrow(NotFoundException);
    });

    it('handles race condition with E11000 duplicate key error gracefully', async () => {
      mockApplyJobModel.findOne.mockResolvedValueOnce(null);
      mockApplyJobModel.mockImplementationOnce(() => ({
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      }));

      await expect(
        service.create(validDto as any, candidateId),
      ).rejects.toThrow('You have already applied for this job.');
    });
  });

  describe('resume access control (SEC-003)', () => {
    beforeEach(() => {
      mockApplyJobModel.findById.mockResolvedValue(mockApplication);
      mockJobModel.findById.mockResolvedValue(mockJob);
    });

    it('allows applicant to access their own resume', async () => {
      const res = await service.getResume(applicationId, candidateId, 'user');
      expect(res.resumeUrl).toBe(mockApplication.resumeUrl);
    });

    it('allows company that posted the job to access applicant resume', async () => {
      const res = await service.getResume(applicationId, companyId, 'company');
      expect(res.resumeUrl).toBe(mockApplication.resumeUrl);
    });

    it('denies access to an unrelated company', async () => {
      await expect(
        service.getResume(applicationId, otherCompanyId, 'company'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies access to an unrelated candidate', async () => {
      await expect(
        service.getResume(applicationId, otherCandidateId, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to access applicant resume', async () => {
      const res = await service.getResume(applicationId, 'admin_id', 'admin');
      expect(res.resumeUrl).toBe(mockApplication.resumeUrl);
    });
  });

  describe('withdraw application', () => {
    it('allows candidate to withdraw their active application', async () => {
      const mockDoc = {
        _id: applicationId,
        userId: candidateId,
        jobId,
        status: 'applied',
        stageHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockApplyJobModel.findById.mockResolvedValue(mockDoc);
      mockJobModel.findById.mockResolvedValue(mockJob);

      const res = await service.withdraw(applicationId, candidateId);
      expect(mockDoc.status).toBe('withdrawn');
      expect(mockDoc.save).toHaveBeenCalled();
      expect(res.status).toBe('withdrawn');
    });

    it('denies withdrawal if another user attempts it', async () => {
      const mockDoc = {
        _id: applicationId,
        userId: candidateId,
        jobId,
        status: 'applied',
      };
      mockApplyJobModel.findById.mockResolvedValue(mockDoc);

      await expect(
        service.withdraw(applicationId, otherCandidateId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
