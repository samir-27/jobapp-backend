import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplyJobDocument = ApplyJob & Document;

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

@Schema({ _id: false })
export class StageHistoryItem {
  @Prop({
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
    required: true,
  })
  stage: ApplicationStage;

  @Prop({ required: true })
  changedBy: string;

  @Prop({ required: true })
  changedByRole: string;

  @Prop({ maxlength: 500 })
  note?: string;

  @Prop({ default: Date.now })
  changedAt: Date;
}

@Schema({ _id: false })
export class CandidateEvaluationNote {
  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true, maxlength: 100 })
  authorName: string;

  @Prop({ required: true, maxlength: 2000 })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class ApplyJob {
  @Prop({ maxlength: 150 })
  fullname: string;

  @Prop({ minlength: 10, maxlength: 10 })
  phone: string;

  @Prop({ maxlength: 255 })
  description: string;

  @Prop({ maxlength: 500 })
  profileImg: string;

  @Prop({
    type: String,
    enum: ['diploma', 'graduation', 'post-graduation'],
    required: true,
  })
  education: string;

  @Prop({ maxlength: 100 })
  course: string;

  @Prop()
  resumeUrl: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  jobId: string;

  // ── Recruitment Pipeline Stage ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true,
  })
  status: ApplicationStage;

  @Prop({ type: [StageHistoryItem], default: [] })
  stageHistory: StageHistoryItem[];

  @Prop({ type: [CandidateEvaluationNote], default: [] })
  notes: CandidateEvaluationNote[];

  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ maxlength: 1000 })
  coverLetter?: string;
}

export const ApplyJobSchema = SchemaFactory.createForClass(ApplyJob);

ApplyJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
ApplyJobSchema.index({ jobId: 1, status: 1 });
