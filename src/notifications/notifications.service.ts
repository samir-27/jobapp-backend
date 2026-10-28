import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(payload: {
    recipient: string;
    recipientRole: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }): Promise<Notification> {
    return this.notificationModel.create({
      recipient: new Types.ObjectId(payload.recipient),
      recipientRole: payload.recipientRole,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'system',
      link: payload.link,
      read: false,
    });
  }

  async getUserNotifications(recipientId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);

    const filter = { recipient: new Types.ObjectId(recipientId) };

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, read: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async markAsRead(notificationId: string, recipientId: string) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipient.toString() !== recipientId) {
      throw new ForbiddenException('Not authorized to access this notification');
    }

    notification.read = true;
    await notification.save();

    return { message: 'Notification marked as read', notification };
  }

  async markAllAsRead(recipientId: string) {
    await this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(recipientId), read: false },
      { $set: { read: true } },
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(recipientId: string): Promise<{ unreadCount: number }> {
    const count = await this.notificationModel.countDocuments({
      recipient: new Types.ObjectId(recipientId),
      read: false,
    });
    return { unreadCount: count };
  }
}
