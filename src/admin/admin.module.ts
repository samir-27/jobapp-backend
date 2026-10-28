import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../users/users.schema';
import { Company, CompanySchema } from '../companies/companies.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { ApplyJob, ApplyJobSchema } from '../applyJobs/applyJobs.schema';
import { Interview, InterviewSchema } from '../interviews/interview.schema';
import { Offer, OfferSchema } from '../offers/offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema },
      { name: ApplyJob.name, schema: ApplyJobSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
