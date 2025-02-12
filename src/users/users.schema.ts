import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  fullname: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'] })
  education: string;

  @Prop()
  course: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Job' }] })
  appliedJobs: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);