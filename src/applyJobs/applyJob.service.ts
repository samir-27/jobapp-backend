import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApplyJob } from "./applyJobs.schema";
import { User } from "src/users/users.schema";
import { Job } from "src/jobs/jobs.schema";

@Injectable()
export class ApplyJobService {
  constructor(@InjectModel(ApplyJob.name) private applyJobModel: Model<ApplyJob>,
  @InjectModel(Job.name) private jobModel: Model<Job>,  // Inject Job model
  @InjectModel(User.name) private userModel: Model<User>) {}

  async create(data: any): Promise<ApplyJob> {
    const jobApplication = new this.applyJobModel(data);
    await jobApplication.save();
    await this.jobModel.findByIdAndUpdate(data.jobId, {
      $push: { appliedUsers: data.userId },
    });
  
    // Update User schema
    await this.userModel.findByIdAndUpdate(data.userId, {
      $push: { appliedJobs: data.jobId },
    });
  
    return jobApplication;
  }
  async findByUser(userId: string): Promise<ApplyJob[]> {
    return this.applyJobModel.find({ userId }).exec();
  }
}
