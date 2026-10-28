import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  recipient: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['user', 'company', 'admin'],
    required: true,
  })
  recipientRole: string;

  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, maxlength: 1000 })
  message: string;

  @Prop({
    type: String,
    enum: ['application_status', 'new_applicant', 'system', 'job_alert', 'interview'],
    default: 'system',
  })
  type: string;

  @Prop({ maxlength: 500 })
  link?: string;

  @Prop({ default: false, index: true })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
