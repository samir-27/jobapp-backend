import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type InterviewDocument = Interview & Document;

export type InterviewStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

@Schema({ timestamps: true })
export class Interview {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ApplyJob',
    required: true,
    index: true,
  })
  application: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  })
  job: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  candidate: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  })
  company: Types.ObjectId;

  @Prop({ required: true, maxlength: 150 })
  title: string;

  @Prop({ required: true, type: Date })
  scheduledAt: Date;

  @Prop({ type: Number, default: 45, min: 15, max: 240 })
  durationMinutes: number;

  @Prop({
    type: String,
    enum: ['remote', 'in-person', 'phone'],
    default: 'remote',
  })
  mode: string;

  @Prop({ maxlength: 500 })
  meetingLink?: string;

  @Prop({ maxlength: 255 })
  location?: string;

  @Prop({ type: [String], default: [] })
  interviewers: string[];

  @Prop({
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
    index: true,
  })
  status: InterviewStatus;

  @Prop({ maxlength: 2000 })
  feedback?: string;

  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ maxlength: 1000 })
  notes?: string;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);
