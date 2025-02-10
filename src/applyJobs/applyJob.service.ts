import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApplyJob } from "./applyJobs.schema";

@Injectable()
export class ApplyJobService {
  constructor(@InjectModel(ApplyJob.name) private applyJobModel: Model<ApplyJob>) {}

  async create(data: any): Promise<ApplyJob> {
    const jobApplication = new this.applyJobModel(data);
    return jobApplication.save();
  }
}
