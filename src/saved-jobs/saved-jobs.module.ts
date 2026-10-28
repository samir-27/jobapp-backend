import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedJob, SavedJobSchema } from './saved-job.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { SavedJobsService } from './saved-jobs.service';
import { SavedJobsController } from './saved-jobs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedJob.name, schema: SavedJobSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  providers: [SavedJobsService],
  controllers: [SavedJobsController],
  exports: [SavedJobsService],
})
export class SavedJobsModule {}
