import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CompaniesModule } from './companies/companies.module';
import { ApplyJobModule } from './applyJobs/applyJob.module';
import { ReviewModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { EmailModule } from './email/email.module';
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';
import { ProfilesModule } from './profiles/profiles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InterviewsModule } from './interviews/interviews.module';
import { TeamModule } from './team/team.module';
import { OffersModule } from './offers/offers.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/jobdb',
    ),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    JobsModule,
    CompaniesModule,
    ApplyJobModule,
    ReviewModule,
    AdminModule,
    ContactModule,
    EmailModule,
    SavedJobsModule,
    ProfilesModule,
    NotificationsModule,
    InterviewsModule,
    TeamModule,
    OffersModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
