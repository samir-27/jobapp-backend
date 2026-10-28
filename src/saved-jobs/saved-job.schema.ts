import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SavedJobDocument = SavedJob & Document;

@Schema({ timestamps: true })
export class SavedJob {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Job', required: true, index: true })
  job: Types.ObjectId;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

export const SavedJobSchema = SchemaFactory.createForClass(SavedJob);

// Compound unique index so a user cannot save the same job twice
SavedJobSchema.index({ user: 1, job: 1 }, { unique: true });
