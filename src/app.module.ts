import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CompaniesModule } from './companies/companies.module';
import { ApplyJobModule } from './applyJobs/applyJob.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/jobdb'),
    UsersModule,
    JobsModule,
    CompaniesModule,
    ApplyJobModule
  ],
})
export class AppModule {}
