import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

export type AccountStatus = 'active' | 'pending_verification' | 'suspended';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret: any) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
})
export class Company {
  @Prop({
    default:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBjgXDUvEHMjJJlT6yMh_kWZ2UKT4Joc7Yqg&s',
  })
  logo: string;

  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  email: string;

  @Prop({ required: true, minlength: 8, maxlength: 100, select: false })
  password: string;

  @Prop({ maxlength: 200 })
  slogan: string;

  @Prop({ maxlength: 1000 })
  description: string;

  @Prop({ maxlength: 255 })
  address: string;

  @Prop({ maxlength: 100 })
  city: string;

  @Prop({ maxlength: 50 })
  companySize: string;

  // ── Account status ────────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['active', 'pending_verification', 'suspended'],
    default: 'active',
  })
  accountStatus: AccountStatus;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  // ── Email verification ────────────────────────────────────────────────────
  @Prop({ type: String, select: false })
  emailVerificationToken: string;

  @Prop({ type: Date, select: false })
  emailVerificationExpires: Date;

  // ── Password reset ────────────────────────────────────────────────────────
  @Prop({ type: String, select: false })
  passwordResetToken: string;

  @Prop({ type: Date, select: false })
  passwordResetExpires: Date;

  // ── Refresh token (hashed) ────────────────────────────────────────────────
  @Prop({ type: String, select: false })
  refreshTokenHash: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
