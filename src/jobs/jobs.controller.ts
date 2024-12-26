import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
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
  findAll() {
    return this.jobService.findAll();
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
