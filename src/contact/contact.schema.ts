import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, maxlength: 255 })
  email: string;

  @Prop({ maxlength: 20 })
  phone: string;

  @Prop({ required: true, maxlength: 2000 })
  message: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
