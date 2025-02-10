import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplyJobController } from "./applyJobs.controller";
import { ApplyJobService } from "./applyJob.service";
import { ApplyJob, ApplyJobSchema } from "./applyJobs.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: ApplyJob.name, schema: ApplyJobSchema }])],
  controllers: [ApplyJobController],
  providers: [ApplyJobService],
})
export class ApplyJobModule {}
