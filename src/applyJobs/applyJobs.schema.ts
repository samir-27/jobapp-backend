import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplyJobDocument = ApplyJob & Document;

@Schema({ timestamps: true })
export class ApplyJob {
  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'], required: true })
  education: string;

  @Prop({ required: true })
  course: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  jobId: string;
}

export const ApplyJobSchema = SchemaFactory.createForClass(ApplyJob);
