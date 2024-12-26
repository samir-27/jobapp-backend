import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  role: string;

  @Prop({ type: [String], required: true })
  skills: string[];

  @Prop({ required: true })
  salary: number;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true, enum: ['remote', 'hybrid', 'location'] })
  location: string;

  @Prop({ default: new Date() })
  postedDate: Date;

  @Prop({ type: String })
  companyName: string;

  @Prop({ type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] })
  jobType: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
