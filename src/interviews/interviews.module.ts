import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from './interview.schema';
import { ApplyJob, ApplyJobSchema } from '../applyJobs/applyJobs.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: ApplyJob.name, schema: ApplyJobSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    NotificationsModule,
  ],
  providers: [InterviewsService],
  controllers: [InterviewsController],
  exports: [InterviewsService],
})
export class InterviewsModule {}
