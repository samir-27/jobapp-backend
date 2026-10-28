import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.schema';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationModel: any;

  const validUserId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const validNotificationId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockNotificationModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('creates a new notification with default system type', async () => {
      mockNotificationModel.create.mockResolvedValue({
        recipient: validUserId,
        title: 'Welcome',
        message: 'Welcome to the platform',
      });

      const res = await service.create({
        recipient: validUserId,
        recipientRole: 'user',
        title: 'Welcome',
        message: 'Welcome to the platform',
      });

      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(res.title).toBe('Welcome');
    });
  });

  describe('markAsRead', () => {
    it('throws NotFoundException if notification does not exist', async () => {
      mockNotificationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.markAsRead(validNotificationId, validUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if notification belongs to someone else', async () => {
      mockNotificationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          recipient: new Types.ObjectId(otherUserId),
          read: false,
        }),
      });

      await expect(
        service.markAsRead(validNotificationId, validUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('marks notification as read successfully', async () => {
      const mockDoc = {
        recipient: new Types.ObjectId(validUserId),
        read: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockNotificationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const res = await service.markAsRead(validNotificationId, validUserId);
      expect(mockDoc.read).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(res.message).toBe('Notification marked as read');
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread notifications', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await service.markAllAsRead(validUserId);
      expect(mockNotificationModel.updateMany).toHaveBeenCalled();
      expect(res.message).toBe('All notifications marked as read');
    });
  });
});
