import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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
export class User {
  @Prop({ required: true, type: String, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, type: String, maxlength: 255 })
  email: string;

  @Prop({ required: true, type: String, minlength: 8, maxlength: 100, select: false })
  password: string;

  @Prop({ type: String, maxlength: 150 })
  fullname: string;

  @Prop({ type: String, match: /^[0-9]{10}$/ })
  phone: string;

  @Prop({ type: String, maxlength: 255 })
  address: string;

  @Prop({ type: String, maxlength: 6 })
  pincode: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  state: string;

  @Prop({
    type: String,
    default: 'https://i.pinimg.com/564x/05/5a/91/055a91979264664a1ee12b9453610d82.jpg',
  })
  profileImg: string;

  @Prop({ type: String, enum: ['diploma', 'graduation', 'post-graduation'] })
  education: string;

  @Prop({ type: String, maxlength: 100 })
  course: string;

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

export const UserSchema = SchemaFactory.createForClass(User);
