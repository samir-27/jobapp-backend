import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: {
    actorId: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    try {
      return await this.auditLogModel.create(entry);
    } catch (err: any) {
      this.logger.error(`Failed to record audit log: ${err.message}`);
      return null as any;
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
    actorId?: string;
  }) {
    const safeLimit = Math.min(Math.max(1, Number(params.limit) || 50), 100);
    const safePage = Math.max(1, Number(params.page) || 1);

    const query: any = {};
    if (params.entity) query.entity = params.entity;
    if (params.action) query.action = params.action;
    if (params.actorId) query.actorId = params.actorId;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
