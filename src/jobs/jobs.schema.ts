import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Company } from '../companies/companies.schema';

export type JobDocument = Job & Document;

export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, maxlength: 2000 })
  description: string;

  @Prop({ required: true, maxlength: 50 })
  role: string;

  @Prop({ type: [String], required: true })
  skills: string[];

  @Prop({ required: true, min: 10000, max: 10000000 })
  salary: number;

  @Prop({
    required: true,
    enum: ['fresher', '1-3years', '3-5years', '5-10years', '10-20years'],
  })
  experience: string;

  @Prop({ required: true, enum: ['remote', 'hybrid', 'on-site'] })
  location: string;

  @Prop({ default: Date.now })
  postedDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  company: Company;

  @Prop({ type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] })
  jobType: string;

  @Prop({ type: [String], required: true, maxlength: 500 })
  responsibilities: string[];

  @Prop({ type: [String], required: true, maxlength: 500 })
  requirements: string[];

  @Prop({ type: [String], required: true, maxlength: 500 })
  niceToHave: string[];

  // ── Production Pipeline Fields ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
    index: true,
  })
  status: JobStatus;

  @Prop({ type: Number, default: 0 })
  viewsCount: number;

  @Prop({ type: Number, default: 0 })
  applicantsCount: number;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ maxlength: 100 })
  department?: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Text search index for title, description, role, and skills
JobSchema.index(
  {
    title: 'text',
    description: 'text',
    role: 'text',
    skills: 'text',
  },
  {
    weights: {
      title: 10,
      skills: 8,
      role: 6,
      description: 2,
    },
    name: 'JobTextIndex',
  },
);
