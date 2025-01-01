import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './jobs.schema';

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async createJob(createJobDto: Partial<Job>, companyId: string): Promise<Job> {
    const newJob = new this.jobModel({ ...createJobDto, company: companyId });
    return newJob.save();
  }
  

async findAll(filters: {
  title?: string;
  role?: string;
  location?: string;
  jobType?: string;
  salary?: number;
  experience?: string;
  skills?: string;
  sortBy?: string;
}): Promise<Job[]> {
  const query: any = {};

  if (filters.title) {
    query.title = { $regex: filters.title, $options: 'i' };
  }
  if (filters.role) {
    query.role = { $regex: filters.role, $options: 'i' }; 
  }
  if (filters.location) {
    query.location = filters.location;
  }
  if (filters.jobType) {
    query.jobType = filters.jobType;
  }
  if (filters.experience) {
    query.experience = filters.experience;
  }
  if (filters.skills) {
    // query.skills = { $all: filters.skills.split(',') }; 
    const skillsArray = filters.skills.split(',');  // Split input into an array of skills
    query.skills = { 
      $in: skillsArray.map(skill => new RegExp(skill, 'i'))
    };
    
    
  }

  let sort = {};
  if (filters.sortBy) {
    const sortField = filters.sortBy.startsWith('-') ? filters.sortBy.slice(1) : filters.sortBy;
    const sortOrder = filters.sortBy.startsWith('-') ? -1 : 1;
    sort = { [sortField]: sortOrder };
  }

  return this.jobModel.find(query).sort(sort).exec();
}

async findJobsByCompany(companyId: string): Promise<Job[]> {
  return this.jobModel.find({ company: companyId }).exec();
}



  async findOne(id: string): Promise<Job> {
    const job = await this.jobModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async updateJob(id: string, updateJobDto: Partial<Job>): Promise<Job> {
    const updatedJob = await this.jobModel
      .findByIdAndUpdate(id, updateJobDto, { new: true })
      .exec();
    if (!updatedJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return updatedJob;
  }

  async deleteJob(id: string): Promise<void> {
    const result = await this.jobModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }
}
