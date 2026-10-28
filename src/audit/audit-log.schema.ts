import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, index: true })
  actorId: string;

  @Prop({ required: true, index: true })
  actorRole: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  entity: string;

  @Prop({ index: true })
  entityId?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  details?: Record<string, any>;

  @Prop({ maxlength: 45 })
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entity: 1, action: 1 });
