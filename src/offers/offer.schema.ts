import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'rescinded'
  | 'expired';

@Schema({ timestamps: true })
export class Offer {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ApplyJob',
    required: true,
    index: true,
  })
  application: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  })
  job: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  candidate: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  })
  company: Types.ObjectId;

  @Prop({ required: true, min: 1000 })
  salary: number;

  @Prop({ default: 'USD', maxlength: 10 })
  currency: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ maxlength: 2000 })
  notes?: string;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'rescinded', 'expired'],
    default: 'pending',
    index: true,
  })
  status: OfferStatus;

  @Prop({ maxlength: 1000 })
  candidateResponseNote?: string;

  @Prop({ type: Date })
  respondedAt?: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
