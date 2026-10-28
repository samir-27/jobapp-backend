import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../users/users.schema';
import { Company, CompanyDocument } from '../companies/companies.schema';
import { Admin, AdminDocument } from '../admin/admin.schema';
import { EmailService } from '../email/email.service';
import { getJwtSecret } from './jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const REFRESH_SECRET_SUFFIX = '_refresh';
const REFRESH_EXPIRY = '30d';
const ACCESS_EXPIRY = '15m';
const VERIFY_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly emailService: EmailService,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private getRefreshSecret(): string {
    return getJwtSecret() + REFRESH_SECRET_SUFFIX;
  }

  private generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private signAccessToken(payload: {
    id: string;
    role: 'user' | 'company' | 'admin';
    email: string;
  }): string {
    return jwt.sign(
      { id: payload.id, role: payload.role, type: payload.role, email: payload.email },
      getJwtSecret(),
      { expiresIn: ACCESS_EXPIRY },
    );
  }

  private signRefreshToken(payload: {
    id: string;
    role: 'user' | 'company' | 'admin';
  }): string {
    return jwt.sign({ id: payload.id, role: payload.role, type: 'refresh' }, this.getRefreshSecret(), {
      expiresIn: REFRESH_EXPIRY,
    });
  }

  // ── Register ─────────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; userId?: string }> {
    const { accountType, email, password, name } = dto;

    if (accountType === 'user') {
      const existing = await this.userModel.findOne({ email });
      if (existing) throw new BadRequestException('Email already registered');

      const existingByName = await this.userModel.findOne({ name });
      if (existingByName) throw new BadRequestException('Username already taken');

      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = this.generateOpaqueToken();
      const verificationExpires = new Date(
        Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
      );

      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        emailVerificationToken: this.hashToken(verificationToken),
        emailVerificationExpires: verificationExpires,
        accountStatus: 'active', // allow login without email verification for now
        emailVerified: false,
      });

      // Send verification email (non-blocking — failure logged not thrown)
      this.emailService
        .sendVerificationEmail(email, name, verificationToken)
        .catch((err) => this.logger.error('Email send error', err));

      return { message: 'Registration successful. Check your email to verify your account.', userId: user._id.toString() };
    }

    if (accountType === 'company') {
      const existing = await this.companyModel.findOne({ email });
      if (existing) throw new BadRequestException('Email already registered');

      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = this.generateOpaqueToken();
      const verificationExpires = new Date(
        Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
      );

      const company = await this.companyModel.create({
        name,
        email,
        password: hashedPassword,
        emailVerificationToken: this.hashToken(verificationToken),
        emailVerificationExpires: verificationExpires,
        accountStatus: 'active',
        emailVerified: false,
      });

      this.emailService
        .sendVerificationEmail(email, name, verificationToken)
        .catch((err) => this.logger.error('Email send error', err));

      return { message: 'Company registered. Check your email to verify your account.', userId: company._id.toString() };
    }

    throw new BadRequestException('Invalid account type. Must be "user" or "company".');
  }

  // ── Login ─────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: string;
    // Legacy compat
    token: string;
  }> {
    const { email, password, accountType } = dto;

    // Try user
    if (!accountType || accountType === 'user') {
      const user = await this.userModel
        .findOne({ email })
        .select('+password +refreshTokenHash');
      if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new UnauthorizedException('Invalid email or password');
        if (user.accountStatus === 'suspended') {
          throw new ForbiddenException('Your account has been suspended');
        }
        return this.issueTokens(user._id.toString(), 'user', user.email, user);
      }
    }

    // Try company
    if (!accountType || accountType === 'company') {
      const company = await this.companyModel
        .findOne({ email })
        .select('+password +refreshTokenHash');
      if (company) {
        const match = await bcrypt.compare(password, company.password);
        if (!match) throw new UnauthorizedException('Invalid email or password');
        if (company.accountStatus === 'suspended') {
          throw new ForbiddenException('Your account has been suspended');
        }
        return this.issueTokens(company._id.toString(), 'company', company.email, company);
      }
    }

    // Try admin
    if (!accountType || accountType === 'admin') {
      const admin = await this.adminModel.findOne({ email }).select('+password');
      if (admin) {
        const match = await bcrypt.compare(password, admin.password);
        if (!match) throw new UnauthorizedException('Invalid email or password');
        const accessToken = this.signAccessToken({
          id: admin._id.toString(),
          role: 'admin',
          email: admin.email,
        });
        return {
          accessToken,
          refreshToken: '',
          userId: admin._id.toString(),
          role: 'admin',
          token: accessToken, // legacy
        };
      }
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  private async issueTokens(
    id: string,
    role: 'user' | 'company' | 'admin',
    email: string,
    doc: UserDocument | CompanyDocument,
  ) {
    const accessToken = this.signAccessToken({ id, role, email });
    const refreshToken = this.signRefreshToken({ id, role });
    const refreshHash = this.hashToken(refreshToken);

    await (doc as any).constructor.findByIdAndUpdate(id, {
      refreshTokenHash: refreshHash,
    });

    return { accessToken, refreshToken, userId: id, role, token: accessToken };
  }

  // ── Refresh tokens ────────────────────────────────────────────────────────────

  async refreshTokens(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; token: string }> {
    let payload: any;
    try {
      payload = jwt.verify(oldRefreshToken, this.getRefreshSecret());
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { id, role } = payload;
    const tokenHash = this.hashToken(oldRefreshToken);

    let doc: any = null;
    if (role === 'user') {
      doc = await this.userModel.findById(id).select('+refreshTokenHash');
    } else if (role === 'company') {
      doc = await this.companyModel.findById(id).select('+refreshTokenHash');
    }

    if (!doc || doc.refreshTokenHash !== tokenHash) {
      throw new UnauthorizedException('Refresh token reuse detected or token invalid');
    }

    // Rotate refresh token
    const newAccessToken = this.signAccessToken({ id, role, email: doc.email });
    const newRefreshToken = this.signRefreshToken({ id, role });
    const newHash = this.hashToken(newRefreshToken);

    await doc.constructor.findByIdAndUpdate(id, { refreshTokenHash: newHash });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, token: newAccessToken };
  }

  // ── Logout ────────────────────────────────────────────────────────────────────

  async logout(userId: string, role: 'user' | 'company' | 'admin'): Promise<{ message: string }> {
    if (role === 'user') {
      await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    } else if (role === 'company') {
      await this.companyModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    }
    return { message: 'Logged out successfully' };
  }

  // ── Email verification ────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const doc: any =
      (await this.userModel
        .findOne({
          emailVerificationToken: tokenHash,
          emailVerificationExpires: { $gt: now },
        })
        .select('+emailVerificationToken +emailVerificationExpires')) ||
      (await this.companyModel
        .findOne({
          emailVerificationToken: tokenHash,
          emailVerificationExpires: { $gt: now },
        })
        .select('+emailVerificationToken +emailVerificationExpires'));

    if (!doc) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    doc.emailVerified = true;
    doc.emailVerificationToken = undefined;
    doc.emailVerificationExpires = undefined;
    await doc.save();

    return { message: 'Email verified successfully' };
  }

  async resendVerification(
    email: string,
    accountType: 'user' | 'company',
  ): Promise<{ message: string }> {
    let doc: any = null;
    if (accountType === 'user') {
      doc = await this.userModel
        .findOne({ email })
        .select('+emailVerificationToken +emailVerificationExpires');
    } else {
      doc = await this.companyModel
        .findOne({ email })
        .select('+emailVerificationToken +emailVerificationExpires');
    }

    if (!doc) throw new NotFoundException('No account with that email');
    if (doc.emailVerified) throw new BadRequestException('Email is already verified');

    const verificationToken = this.generateOpaqueToken();
    doc.emailVerificationToken = this.hashToken(verificationToken);
    doc.emailVerificationExpires = new Date(
      Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    await doc.save();

    this.emailService
      .sendVerificationEmail(email, doc.name, verificationToken)
      .catch((err) => this.logger.error('Email send error', err));

    return { message: 'Verification email sent' };
  }

  // ── Forgot / Reset Password ────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email, accountType } = dto;
    let doc: any = null;

    if (!accountType || accountType === 'user') {
      doc = await this.userModel
        .findOne({ email })
        .select('+passwordResetToken +passwordResetExpires');
    }
    if (!doc && (!accountType || accountType === 'company')) {
      doc = await this.companyModel
        .findOne({ email })
        .select('+passwordResetToken +passwordResetExpires');
    }

    // Always return success to prevent user enumeration
    if (!doc) {
      return { message: 'If that email is registered, a reset link has been sent.' };
    }

    const resetToken = this.generateOpaqueToken();
    doc.passwordResetToken = this.hashToken(resetToken);
    doc.passwordResetExpires = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    await doc.save();

    this.emailService
      .sendPasswordResetEmail(email, doc.name, resetToken)
      .catch((err) => this.logger.error('Email send error', err));

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const doc: any =
      (await this.userModel
        .findOne({
          passwordResetToken: tokenHash,
          passwordResetExpires: { $gt: now },
        })
        .select('+passwordResetToken +passwordResetExpires')) ||
      (await this.companyModel
        .findOne({
          passwordResetToken: tokenHash,
          passwordResetExpires: { $gt: now },
        })
        .select('+passwordResetToken +passwordResetExpires'));

    if (!doc) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    doc.password = await bcrypt.hash(newPassword, 12);
    doc.passwordResetToken = undefined;
    doc.passwordResetExpires = undefined;
    doc.refreshTokenHash = undefined; // Invalidate all sessions on password reset
    await doc.save();

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ── Profile (current user) ────────────────────────────────────────────────

  async getMe(
    userId: string,
    role: 'user' | 'company' | 'admin',
  ): Promise<any> {
    if (role === 'user') {
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      return user;
    }
    if (role === 'company') {
      const company = await this.companyModel.findById(userId);
      if (!company) throw new NotFoundException('Company not found');
      return company;
    }
    if (role === 'admin') {
      const admin = await this.adminModel.findById(userId);
      if (!admin) throw new NotFoundException('Admin not found');
      return admin;
    }
    throw new UnauthorizedException();
  }
}
