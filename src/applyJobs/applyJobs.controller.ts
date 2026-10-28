import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApplyJobService } from './applyJob.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { resumeStorage } from 'cloudinary.config';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateApplyJobDto } from './dto/create-apply-job.dto';
import { UpdateApplicationStageDto } from './dto/update-stage.dto';
import { AddCandidateNoteDto } from './dto/add-candidate-note.dto';
import { RateCandidateDto } from './dto/rate-candidate.dto';

@Controller('applyjob')
export class ApplyJobController {
  constructor(private readonly applyJobService: ApplyJobService) {}

  @Roles('user')
  @Post('create')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: resumeStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const ext = file.originalname.toLowerCase();
        if (
          !allowedMimes.includes(file.mimetype) ||
          !(ext.endsWith('.pdf') || ext.endsWith('.doc') || ext.endsWith('.docx'))
        ) {
          return cb(
            new BadRequestException(
              'Only PDF, DOC, and DOCX documents up to 5MB are accepted for resumes.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateApplyJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.create(body, user.id, file);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.findByUser(userId, user.id, user.role);
  }

  @Roles('company', 'admin')
  @Get('job/:jobId')
  async findByJob(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.findByJob(jobId, user.id, user.role);
  }

  @Get('resume/:id')
  async getResume(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.getResume(id, user.id, user.role);
  }

  @Roles('user')
  @Post(':id/withdraw')
  async withdraw(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.withdraw(id, user.id);
  }

  // ── Phase 3 Pipeline Endpoints ───────────────────────────────────────────────

  @Roles('company', 'admin')
  @Patch(':id/stage')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.updateStage(id, dto, user.id, user.role);
  }

  @Roles('company', 'admin')
  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddCandidateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.addNote(
      id,
      dto,
      user.id,
      user.email || 'Recruiter',
      user.role,
    );
  }

  @Roles('company', 'admin')
  @Patch(':id/rate')
  async rateCandidate(
    @Param('id') id: string,
    @Body() dto: RateCandidateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyJobService.rateCandidate(id, dto.rating, user.id, user.role);
  }
}
