import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailModule } from '../email/email.module';
import { User, UserSchema } from '../users/users.schema';
import { Company, CompanySchema } from '../companies/companies.schema';
import { Admin, AdminSchema } from '../admin/admin.schema';
import { getJwtSecret } from './jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '15m' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    EmailModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, AuthService],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule, JwtAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
