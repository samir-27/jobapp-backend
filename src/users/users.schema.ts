import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, type: String, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, type: String, maxlength: 255 })
  email: string;

  @Prop({ required: true, type: String, minlength: 8, maxlength: 100 })
  password: string;

  @Prop({ type: String, maxlength: 150 })
  fullname: string;

  @Prop({ type: String, match: /^[0-9]{10}$/ })
  phone: string;

  @Prop({ type: String, maxlength: 255 })
  address: string;

  @Prop({ type: String })
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'] })
  education: string;

  @Prop({ type: String, maxlength: 100 })
  course: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Job' }] })
  appliedJobs: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
