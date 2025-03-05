import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplyJobDocument = ApplyJob & Document;

@Schema({ timestamps: true })
export class ApplyJob {
  @Prop({ required: true, maxlength: 150 })
  fullname: string;

  @Prop({ required: true, minlength: 10, maxlength: 10 })
  phone: string;

  @Prop({ required: true, maxlength: 255 })
  address: string;  

  @Prop({ maxlength: 500 })
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'], required: true })
  education: string;

  @Prop({ required: true, maxlength: 100 })
  course: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  jobId: string;
}

export const ApplyJobSchema = SchemaFactory.createForClass(ApplyJob);
