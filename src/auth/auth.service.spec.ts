import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { User } from '../users/users.schema';
import { Company } from '../companies/companies.schema';
import { Admin } from '../admin/admin.schema';
import { EmailService } from '../email/email.service';
import { BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockCompanyModel: any;
  let mockAdminModel: any;
  let mockEmailService: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    mockCompanyModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    mockAdminModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Company.name), useValue: mockCompanyModel },
        { provide: getModelToken(Admin.name), useValue: mockAdminModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws BadRequestException if user email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'Password123!',
          accountType: 'user',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates new user and sends verification email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test',
        email: 'test@example.com',
      });

      const res = await service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'Password123!',
        accountType: 'user',
      });

      expect(res.message).toContain('Registration successful');
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('creates new company account', async () => {
      mockCompanyModel.findOne.mockResolvedValue(null);
      mockCompanyModel.create.mockResolvedValue({
        _id: 'comp123',
        name: 'Acme Corp',
        email: 'jobs@acme.com',
      });

      const res = await service.register({
        name: 'Acme Corp',
        email: 'jobs@acme.com',
        password: 'Password123!',
        accountType: 'company',
      });

      expect(res.message).toContain('Company registered');
      expect(mockCompanyModel.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException if credentials invalid', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({
          email: 'none@example.com',
          password: 'WrongPassword',
          accountType: 'user',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException if user is suspended', async () => {
      const hashedPassword = bcrypt.hashSync('Password123!', 10);
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'user123',
          email: 'test@example.com',
          password: hashedPassword,
          accountStatus: 'suspended',
        }),
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'Password123!',
          accountType: 'user',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('forgotPassword', () => {
    it('returns generic success message even if account is not found (anti-enumeration)', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await service.forgotPassword({
        email: 'unknown@example.com',
        accountType: 'user',
      });

      expect(res.message).toContain('If that email is registered');
    });
  });
});
