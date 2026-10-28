import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobsService) {}

  @Roles('company')
  @Post()
  createJob(
    @Body() createJobDto: CreateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.createJob(createJobDto, user.id);
  }

  @Public()
  @Get()
  async getJobs(@Query() query: JobQueryDto) {
    return this.jobService.findAll(query);
  }

  @Roles('user')
  @Get('match/recommendations')
  async getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
  ) {
    return this.jobService.getRecommendations(user.id, limit ? Number(limit) : 10);
  }

  @Public()
  @Get('company/:companyId')
  findJobsByCompany(@Param('companyId') companyId: string) {
    return this.jobService.findJobsByCompany(companyId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':id/view')
  recordView(@Param('id') id: string) {
    return this.jobService.recordView(id);
  }

  @Roles('company', 'admin')
  @Patch(':id/status')
  updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.updateJobStatus(id, dto.status, user.id, user.role);
  }

  @Patch(':id')
  updateJob(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.updateJob(id, updateJobDto, user.id, user.role);
  }

  @Delete(':id')
  deleteJob(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.deleteJob(id, user.id, user.role);
  }
}
