import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.schema';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

describe('UsersService (Unit Tests)', () => {
  let service: UsersService;
  let mockUserModel: any;

  const rawPassword = 'SecurePassword123!';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

  const mockUserDoc = {
    _id: '507f1f77bcf86cd799439011',
    name: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
    fullname: 'Test User',
    profileImg: 'https://example.com/profile.jpg',
    toJSON() {
      const copy = { ...this };
      delete (copy as any).password;
      return copy;
    },
  };

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...dto,
      }),
    }));

    mockUserModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserDoc),
      exec: jest.fn().mockResolvedValue(mockUserDoc),
    });

    mockUserModel.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserDoc),
      exec: jest.fn().mockResolvedValue(mockUserDoc),
    });

    mockUserModel.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockUserDoc]),
    });

    mockUserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUserDoc);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('signin', () => {
    it('issues signed JWT on valid credentials', async () => {
      const res = await service.signin('test@example.com', rawPassword);
      expect(res.token).toBeDefined();
      expect(res.userId).toBe('507f1f77bcf86cd799439011');
      const decoded: any = jwt.decode(res.token);
      expect(decoded.id).toBe('507f1f77bcf86cd799439011');
      expect(decoded.role).toBe('user');
    });

    it('rejects invalid password with UnauthorizedException', async () => {
      await expect(
        service.signin('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateUser password verification', () => {
    it('requires current password to update password', async () => {
      await expect(
        service.updateUser('507f1f77bcf86cd799439011', {
          password: 'NewPassword123!',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully updates password when current password matches', async () => {
      const res = await service.updateUser('507f1f77bcf86cd799439011', {
        currentPassword: rawPassword,
        password: 'NewPassword123!',
      } as any);
      expect(res).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
