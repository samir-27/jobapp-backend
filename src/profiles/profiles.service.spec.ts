import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProfilesService } from './profiles.service';
import { JobSeekerProfile } from './profile.schema';
import { User } from '../users/users.schema';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let mockProfileModel: any;
  let mockUserModel: any;

  const validUserId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockProfileModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getModelToken(JobSeekerProfile.name),
          useValue: mockProfileModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  describe('getMyProfile', () => {
    it('returns existing profile if found', async () => {
      const mockProfile = { user: validUserId, headline: 'Software Engineer' };
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProfile),
        }),
      });

      const res = await service.getMyProfile(validUserId);
      expect(res).toEqual(mockProfile);
    });

    it('creates profile if not found', async () => {
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const created = {
        user: validUserId,
        populate: jest.fn().mockResolvedValue({ user: validUserId }),
      };
      mockProfileModel.create.mockResolvedValue(created);

      const res = await service.getMyProfile(validUserId);
      expect(mockProfileModel.create).toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('getProfileByUserId', () => {
    it('throws ForbiddenException if profile is private and requester is not company/admin', async () => {
      const privateProfile = {
        user: validUserId,
        isPublic: false,
      };
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(privateProfile),
        }),
      });

      await expect(
        service.getProfileByUserId(validUserId, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows company to view private candidate profile', async () => {
      const privateProfile = {
        user: validUserId,
        isPublic: false,
      };
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(privateProfile),
        }),
      });

      const res = await service.getProfileByUserId(validUserId, 'company');
      expect(res).toEqual(privateProfile);
    });

    it('throws NotFoundException if profile does not exist', async () => {
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.getProfileByUserId(validUserId, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
