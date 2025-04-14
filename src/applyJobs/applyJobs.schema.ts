import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplyJobDocument = ApplyJob & Document;

@Schema({ timestamps: true })
export class ApplyJob {
  @Prop({ maxlength: 150 })
  fullname: string;

  @Prop({minlength: 10, maxlength: 10 })
  phone: string;

  @Prop({ maxlength: 255 })
  description: string;  

  @Prop({ maxlength: 500 })
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'], required: true })
  education: string;

  @Prop({ maxlength: 100 })
  course: string;

  @Prop()
  resumeUrl: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  jobId: string;
}

export const ApplyJobSchema = SchemaFactory.createForClass(ApplyJob);
