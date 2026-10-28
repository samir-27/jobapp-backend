import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Admin } from './admin.schema';
import { User } from '../users/users.schema';
import { Company } from '../companies/companies.schema';
import { Job } from '../jobs/jobs.schema';
import { ApplyJob } from '../applyJobs/applyJobs.schema';
import { Interview } from '../interviews/interview.schema';
import { Offer } from '../offers/offer.schema';
import * as bcrypt from 'bcryptjs';

describe('AdminService (Unit Tests)', () => {
  let service: AdminService;
  let mockAdminModel: any;

  const rawPassword = 'AdminSecret123!';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

  const mockAdminDoc = {
    _id: '607f1f77bcf86cd799439022',
    email: 'admin@platform.test',
    password: hashedPassword,
  };

  const defaultMock = {
    countDocuments: jest.fn().mockResolvedValue(10),
    findByIdAndUpdate: jest.fn().mockResolvedValue({ status: 'active' }),
  };

  beforeEach(async () => {
    mockAdminModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '607f1f77bcf86cd799439022',
      save: jest.fn().mockResolvedValue({
        _id: '607f1f77bcf86cd799439022',
        ...dto,
      }),
    }));

    mockAdminModel.countDocuments = jest.fn().mockResolvedValue(1);
    mockAdminModel.findOne = jest.fn().mockImplementation((filter) => ({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAdminDoc),
      }),
      exec: jest.fn().mockResolvedValue(
        filter?.email === 'anotheradmin@platform.test' ? null : null,
      ),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(Admin.name), useValue: mockAdminModel },
        { provide: getModelToken(User.name), useValue: defaultMock },
        { provide: getModelToken(Company.name), useValue: defaultMock },
        { provide: getModelToken(Job.name), useValue: defaultMock },
        { provide: getModelToken(ApplyJob.name), useValue: defaultMock },
        { provide: getModelToken(Interview.name), useValue: defaultMock },
        { provide: getModelToken(Offer.name), useValue: defaultMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('signIn', () => {
    it('authenticates valid admin credentials and issues signed token', async () => {
      const result = await service.signIn({
        email: 'admin@platform.test',
        password: rawPassword,
      });

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.admin.email).toBe('admin@platform.test');
    });

    it('rejects incorrect admin password with 401 Unauthorized', async () => {
      await expect(
        service.signIn({
          email: 'admin@platform.test',
          password: 'IncorrectPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register (Bootstrap & RBAC)', () => {
    it('blocks unauthenticated public registration when admin already exists', async () => {
      await expect(
        service.register({
          email: 'newadmin@platform.test',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows registration when caller is existing admin', async () => {
      const result = await service.register(
        {
          email: 'anotheradmin@platform.test',
          password: 'Password123!',
        },
        'admin',
      );

      expect(result.message).toBe('Admin registered successfully');
      expect(result.admin.email).toBe('anotheradmin@platform.test');
    });
  });

  describe('getPlatformStats', () => {
    it('returns platform operational metrics', async () => {
      const stats = await service.getPlatformStats();
      expect(stats.totalUsers).toBe(10);
      expect(stats.totalJobs).toBe(10);
      expect(stats.totalCompanies).toBe(10);
    });
  });
});
