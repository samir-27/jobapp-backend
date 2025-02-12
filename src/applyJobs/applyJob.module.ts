import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplyJobController } from "./applyJobs.controller";
import { ApplyJobService } from "./applyJob.service";
import { ApplyJob, ApplyJobSchema } from "./applyJobs.schema";
import { Job, JobSchema } from "../jobs/jobs.schema"; // Import Job schema
import { User, UserSchema } from "../users/users.schema"; // Import User schema
import { JobsModule } from "../jobs/jobs.module"; // Import JobModule
import { UsersModule } from "../users/users.module"; // Import UserModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApplyJob.name, schema: ApplyJobSchema },
      { name: Job.name, schema: JobSchema },  // Register Job schema
      { name: User.name, schema: UserSchema }, // Register User schema
    ]),
    JobsModule,  // Import JobModule
    UsersModule, // Import UserModule
  ],
  controllers: [ApplyJobController],
  providers: [ApplyJobService],
})
export class ApplyJobModule {}
