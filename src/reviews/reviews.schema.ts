import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true, min: 1, max: 5 })
  stars: number;

  @Prop({ required: true, minlength: 10, maxlength: 500 })
  description: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ default: 0 })
  likes: number;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
