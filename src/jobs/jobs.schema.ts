import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from '../companies/companies.schema';
export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, maxlength: 100 }) // Max 100 characters
  title: string;

  @Prop({ required: true, maxlength: 1000 }) // Max 1000 characters
  description: string;

  @Prop({ required: true, maxlength: 50 }) // Max 50 characters
  role: string;

  @Prop({ type: [String], required: true })
  skills: string[];

  @Prop({ required: true, min: 10000, max: 10000000 }) // Salary between 10k and 10M
  salary: number;

  @Prop({ required: true, enum: ['fresher', '1-3years', '3-5years', '5-10years', '10-20years'] })
  experience: string;

  @Prop({ required: true, enum: ['remote', 'hybrid', 'on-site'] })
  location: string;

  @Prop({ default: new Date() })
  postedDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Company;

  @Prop({ type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] })
  jobType: string;

  @Prop({ type: [String], required: true, maxlength: 500 }) // Each responsibility max 500 characters
  responsibilities: string[];

  @Prop({ type: [String], required: true, maxlength: 500 }) // Each requirement max 500 characters
  requirements: string[];

  @Prop({ type: [String], required: true, maxlength: 500 }) // Each niceToHave max 500 characters
  niceToHave: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] }) // Applied Users
  appliedUsers: Types.ObjectId[];
}

export const JobSchema = SchemaFactory.createForClass(Job);
