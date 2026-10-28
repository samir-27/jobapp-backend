import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TeamMemberDocument = TeamMember & Document;

export type TeamRole = 'admin' | 'recruiter' | 'hiring_manager';
export type MemberStatus = 'active' | 'pending' | 'revoked';

@Schema({ timestamps: true })
export class TeamMember {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  })
  company: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  user?: Types.ObjectId;

  @Prop({ required: true, lowercase: true, maxlength: 255 })
  email: string;

  @Prop({ maxlength: 100 })
  name?: string;

  @Prop({
    type: String,
    enum: ['admin', 'recruiter', 'hiring_manager'],
    default: 'recruiter',
  })
  role: TeamRole;

  @Prop({
    type: String,
    enum: ['active', 'pending', 'revoked'],
    default: 'pending',
  })
  status: MemberStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  invitedBy: Types.ObjectId;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

TeamMemberSchema.index({ company: 1, email: 1 }, { unique: true });
