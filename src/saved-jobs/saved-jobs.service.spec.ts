import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SavedJobsService } from './saved-jobs.service';
import { SavedJob } from './saved-job.schema';
import { Job } from '../jobs/jobs.schema';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

describe('SavedJobsService', () => {
  let service: SavedJobsService;
  let mockSavedJobModel: any;
  let mockJobModel: any;

  const validUserId = new Types.ObjectId().toString();
  const validJobId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockSavedJobModel = {
      create: jest.fn(),
      findOneAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockJobModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedJobsService,
        {
          provide: getModelToken(SavedJob.name),
          useValue: mockSavedJobModel,
        },
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
      ],
    }).compile();

    service = module.get<SavedJobsService>(SavedJobsService);
  });

  describe('saveJob', () => {
    it('throws BadRequestException for invalid jobId', async () => {
      await expect(service.saveJob(validUserId, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if job does not exist', async () => {
      mockJobModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.saveJob(validUserId, validJobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('saves job successfully', async () => {
      mockJobModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validJobId }),
      });
      mockSavedJobModel.create.mockResolvedValue({
        user: validUserId,
        job: validJobId,
      });

      const res = await service.saveJob(validUserId, validJobId, 'my notes');
      expect(res.message).toBe('Job saved successfully');
      expect(mockSavedJobModel.create).toHaveBeenCalled();
    });

    it('handles duplicate saved job with ConflictException', async () => {
      mockJobModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validJobId }),
      });
      mockSavedJobModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.saveJob(validUserId, validJobId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unsaveJob', () => {
    it('throws BadRequestException for invalid id', async () => {
      await expect(service.unsaveJob(validUserId, 'not-valid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if not saved', async () => {
      mockSavedJobModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.unsaveJob(validUserId, validJobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes successfully', async () => {
      mockSavedJobModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'some-id' }),
      });

      const res = await service.unsaveJob(validUserId, validJobId);
      expect(res.message).toBe('Job removed from saved list');
    });
  });

  describe('checkIsSaved', () => {
    it('returns false for invalid jobId', async () => {
      const res = await service.checkIsSaved(validUserId, 'bad-id');
      expect(res.isSaved).toBe(false);
    });

    it('returns true when document count > 0', async () => {
      mockSavedJobModel.countDocuments.mockResolvedValue(1);
      const res = await service.checkIsSaved(validUserId, validJobId);
      expect(res.isSaved).toBe(true);
    });
  });
});
