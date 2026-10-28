import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedJobsService } from './saved-jobs.service';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('saved-jobs')
export class SavedJobsController {
  constructor(private readonly savedJobsService: SavedJobsService) {}

  @Roles('user')
  @Post(':jobId')
  @HttpCode(HttpStatus.CREATED)
  async saveJob(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('notes') notes?: string,
  ) {
    return this.savedJobsService.saveJob(user.id, jobId, notes);
  }

  @Roles('user')
  @Delete(':jobId')
  @HttpCode(HttpStatus.OK)
  async unsaveJob(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.savedJobsService.unsaveJob(user.id, jobId);
  }

  @Roles('user')
  @Get()
  async getSavedJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.savedJobsService.getUserSavedJobs(user.id, page, limit);
  }

  @Roles('user')
  @Get('check/:jobId')
  async checkSaved(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.savedJobsService.checkIsSaved(user.id, jobId);
  }
}
