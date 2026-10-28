import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TeamService } from './team.service';
import { TeamMember } from './team-member.schema';
import { Company } from '../companies/companies.schema';
import { User } from '../users/users.schema';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('TeamService', () => {
  let service: TeamService;
  let mockTeamMemberModel: any;
  let mockCompanyModel: any;
  let mockUserModel: any;

  const validCompanyId = new Types.ObjectId().toString();
  const otherCompanyId = new Types.ObjectId().toString();
  const validMemberId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockTeamMemberModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    mockCompanyModel = {
      findById: jest.fn(),
    };

    mockUserModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: getModelToken(TeamMember.name), useValue: mockTeamMemberModel },
        { provide: getModelToken(Company.name), useValue: mockCompanyModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  describe('invite', () => {
    it('throws NotFoundException if company does not exist', async () => {
      mockCompanyModel.findById.mockResolvedValue(null);

      await expect(
        service.invite(validCompanyId, { email: 'recruiter@acme.com' }, validCompanyId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if member already invited and active', async () => {
      mockCompanyModel.findById.mockResolvedValue({ _id: validCompanyId });
      mockTeamMemberModel.findOne.mockResolvedValue({
        email: 'recruiter@acme.com',
        status: 'active',
      });

      await expect(
        service.invite(validCompanyId, { email: 'recruiter@acme.com' }, validCompanyId),
      ).rejects.toThrow(ConflictException);
    });

    it('creates new team member invitation successfully', async () => {
      mockCompanyModel.findById.mockResolvedValue({ _id: validCompanyId });
      mockTeamMemberModel.findOne.mockResolvedValue(null);
      mockUserModel.findOne.mockResolvedValue(null);
      mockTeamMemberModel.create.mockResolvedValue({
        _id: validMemberId,
        email: 'recruiter@acme.com',
        role: 'recruiter',
        status: 'pending',
      });

      const res = await service.invite(
        validCompanyId,
        { email: 'recruiter@acme.com', role: 'recruiter' },
        validCompanyId,
      );

      expect(res.email).toBe('recruiter@acme.com');
      expect(mockTeamMemberModel.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('marks member status as revoked when caller owns company', async () => {
      const mockMemberDoc = {
        _id: validMemberId,
        company: new Types.ObjectId(validCompanyId),
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      };

      mockTeamMemberModel.findById.mockResolvedValue(mockMemberDoc);

      const res = await service.remove(validMemberId, validCompanyId);
      expect(mockMemberDoc.status).toBe('revoked');
      expect(res.message).toBe('Team member removed successfully');
    });

    it('throws ForbiddenException if caller does not own company', async () => {
      const mockMemberDoc = {
        _id: validMemberId,
        company: new Types.ObjectId(otherCompanyId),
      };

      mockTeamMemberModel.findById.mockResolvedValue(mockMemberDoc);

      await expect(
        service.remove(validMemberId, validCompanyId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
