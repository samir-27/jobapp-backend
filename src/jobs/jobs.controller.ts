import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './jobs.schema';


@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  @Post()
  createJob(@Body() createJobDto: Partial<Job>) {
    return this.jobService.createJob(createJobDto);
  }

 @Get()
  async getJobs(
    @Query('title') title?: string,
    @Query('role') role?: string,
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('experience') experience?: string,
    @Query('skills') skills?: string
  ) {
    return this.jobService.findAll({ title, role, location, jobType, experience, skills, sortBy });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Patch(':id')
  updateJob(@Param('id') id: string, @Body() updateJobDto: Partial<Job>) {
    return this.jobService.updateJob(id, updateJobDto);
  }

  @Delete(':id')
  deleteJob(@Param('id') id: string) {
    return this.jobService.deleteJob(id);
  }
}
