import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.password;
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret: any) => {
      delete ret.password;
      return ret;
    },
  },
})
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
