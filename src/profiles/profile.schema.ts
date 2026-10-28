import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ProfileDocument = JobSeekerProfile & Document;

@Schema({ _id: false })
export class WorkExperienceItem {
  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, maxlength: 100 })
  company: string;

  @Prop({ maxlength: 100 })
  location?: string;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ default: false })
  current?: boolean;

  @Prop({ maxlength: 1000 })
  description?: string;
}

@Schema({ _id: false })
export class EducationItem {
  @Prop({ required: true, maxlength: 150 })
  institution: string;

  @Prop({ required: true, maxlength: 100 })
  degree: string;

  @Prop({ maxlength: 100 })
  fieldOfStudy?: string;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ maxlength: 50 })
  grade?: string;
}

@Schema({ _id: false })
export class SocialLinks {
  @Prop({ maxlength: 255 })
  linkedin?: string;

  @Prop({ maxlength: 255 })
  github?: string;

  @Prop({ maxlength: 255 })
  portfolio?: string;

  @Prop({ maxlength: 255 })
  twitter?: string;
}

@Schema({ timestamps: true })
export class JobSeekerProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ maxlength: 150, default: '' })
  headline: string;

  @Prop({ maxlength: 2000, default: '' })
  bio: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [WorkExperienceItem], default: [] })
  experience: WorkExperienceItem[];

  @Prop({ type: [EducationItem], default: [] })
  education: EducationItem[];

  @Prop({ type: SocialLinks, default: {} })
  socialLinks: SocialLinks;

  @Prop({ maxlength: 500 })
  resumeUrl?: string;

  @Prop({ maxlength: 255 })
  resumeOriginalName?: string;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ type: [String], default: [] })
  preferredRoles: string[];

  @Prop({ type: Number, min: 0 })
  expectedSalary?: number;

  @Prop({ type: [String], default: [] })
  preferredLocations: string[];

  @Prop({
    type: String,
    enum: ['remote', 'hybrid', 'on-site', 'any'],
    default: 'any',
  })
  workPreference: string;
}

export const JobSeekerProfileSchema =
  SchemaFactory.createForClass(JobSeekerProfile);
