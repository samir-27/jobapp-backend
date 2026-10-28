import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job, JobSchema } from './jobs.schema';
import { JobSeekerProfile } from '../profiles/profile.schema';
import { Types } from 'mongoose';

describe('JobsService (Unit Tests)', () => {
  let service: JobsService;
  let mockJobModel: any;

  const mockCompanyId = new Types.ObjectId().toString();
  const mockOtherCompanyId = new Types.ObjectId().toString();
  const mockJobId = new Types.ObjectId().toString();

  const mockJobDoc = {
    _id: mockJobId,
    title: 'Senior NestJS Engineer',
    role: 'Backend Developer',
    description: 'Build robust APIs',
    skills: ['NestJS', 'MongoDB'],
    salary: 120000,
    experience: '3-5years',
    location: 'remote',
    jobType: 'Full-Time',
    company: new Types.ObjectId(mockCompanyId),
    postedDate: new Date(),
  };

  beforeEach(async () => {
    mockJobModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: mockJobId,
        ...dto,
        postedDate: new Date(),
      }),
    }));

    mockJobModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockJobDoc]),
    });

    mockJobModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockJobDoc),
    });

    mockJobModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        ...mockJobDoc,
        title: 'Updated Title',
      }),
    });

    mockJobModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockJobDoc),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(JobSeekerProfile.name),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  describe('createJob', () => {
    it('creates a job bound to the authenticated company ID (SEC-001)', async () => {
      const dto = {
        title: 'Senior Engineer',
        description: 'Great role',
        role: 'Engineering',
        skills: ['NestJS'],
        salary: 150000,
        experience: '3-5years',
        location: 'remote',
      };

      const result = await service.createJob(dto as any, mockCompanyId);
      expect(result).toBeDefined();
      expect(mockJobModel).toHaveBeenCalledWith(
        expect.objectContaining({
          company: new Types.ObjectId(mockCompanyId),
        }),
      );
    });
  });

  describe('findAll safe query building', () => {
    it('escapes regular expression metacharacters to prevent ReDoS (API-001)', async () => {
      await service.findAll({ title: 'Engineer (C++) [v2]*' });
      const findArg = mockJobModel.find.mock.calls[0][0];
      expect(findArg.title.$regex).toBe('Engineer\\ \\(C\\+\\+\\)\\ \\[v2\\]\\*');
      expect(findArg.title.$options).toBe('i');
    });

    it('applies salary filter and sort criteria (API-001)', async () => {
      await service.findAll({ salary: 80000, sortBy: 'salary_desc' });
      const findArg = mockJobModel.find.mock.calls[0][0];
      expect(findArg.salary).toEqual({ $gte: 80000 });
    });

    it('bounds pagination within allowable max (API-001)', async () => {
      const queryChain = mockJobModel.find();
      await service.findAll({ page: 2, limit: 200 });
      // limit capped at 100 max
      expect(queryChain.limit).toHaveBeenCalledWith(100);
      expect(queryChain.skip).toHaveBeenCalledWith(100); // (2 - 1) * 100
    });
  });

  describe('findJobsByCompany', () => {
    it('casts company IDs to ObjectIds for company job queries', async () => {
      await service.findJobsByCompany(mockCompanyId);

      expect(mockJobModel.find).toHaveBeenCalledWith({
        company: mockCompanyId,
      });
      expect(JobSchema.path('company').instance).toBe('ObjectId');
      expect(JobSchema.path('company').cast(mockCompanyId)).toEqual(
        new Types.ObjectId(mockCompanyId),
      );
    });
  });

  describe('updateJob ownership check (SEC-001)', () => {
    it('allows job update when caller is the owning company', async () => {
      (mockJobModel.findById as jest.Mock).mockResolvedValueOnce(mockJobDoc);
      const res = await service.updateJob(
        mockJobId,
        { title: 'Updated' },
        mockCompanyId,
        'company',
      );
      expect(res).toBeDefined();
    });

    it('rejects job update when caller is another company', async () => {
      (mockJobModel.findById as jest.Mock).mockResolvedValueOnce(mockJobDoc);
      await expect(
        service.updateJob(
          mockJobId,
          { title: 'Hacked' },
          mockOtherCompanyId,
          'company',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows job update when caller is an admin', async () => {
      (mockJobModel.findById as jest.Mock).mockResolvedValueOnce(mockJobDoc);
      const res = await service.updateJob(
        mockJobId,
        { title: 'Admin Update' },
        'admin_id',
        'admin',
      );
      expect(res).toBeDefined();
    });
  });

  describe('deleteJob ownership check (SEC-001)', () => {
    it('rejects delete when caller does not own the job', async () => {
      (mockJobModel.findById as jest.Mock).mockResolvedValueOnce(mockJobDoc);
      await expect(
        service.deleteJob(mockJobId, mockOtherCompanyId, 'company'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows delete when caller owns the job', async () => {
      (mockJobModel.findById as jest.Mock).mockResolvedValueOnce(mockJobDoc);
      const res = await service.deleteJob(mockJobId, mockCompanyId, 'company');
      expect(res.deleted).toBe(true);
    });
  });
});
