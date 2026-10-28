import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplyJobController } from './applyJobs.controller';
import { ApplyJobService } from './applyJob.service';
import { ApplyJob, ApplyJobSchema } from './applyJobs.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { User, UserSchema } from '../users/users.schema';
import { JobsModule } from '../jobs/jobs.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApplyJob.name, schema: ApplyJobSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JobsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [ApplyJobController],
  providers: [ApplyJobService],
  exports: [ApplyJobService],
})
export class ApplyJobModule {}
