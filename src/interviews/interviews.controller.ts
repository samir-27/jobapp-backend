import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Roles('company')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async schedule(
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interviewsService.schedule(dto, user.id);
  }

  @Get()
  async getMyInterviews(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'company') {
      return this.interviewsService.findByCompany(user.id);
    }
    return this.interviewsService.findByCandidate(user.id);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interviewsService.findOne(id, user.id, user.role);
  }

  @Roles('company', 'admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interviewsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interviewsService.cancel(id, user.id, user.role);
  }
}
