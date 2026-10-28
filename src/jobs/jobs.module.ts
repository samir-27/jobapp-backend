import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './jobs.schema';
import {
  JobSeekerProfile,
  JobSeekerProfileSchema,
} from '../profiles/profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: JobSeekerProfile.name, schema: JobSeekerProfileSchema },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
