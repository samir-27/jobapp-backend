import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ProfilesService } from './profiles.service';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { resumeStorage } from 'cloudinary.config';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Roles('user')
  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.getMyProfile(user.id);
  }

  @Roles('user')
  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateMyProfile(user.id, dto);
  }

  @Roles('user')
  @Post('resume')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: resumeStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PDF and DOC/DOCX files are allowed.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadResume(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No resume file provided');
    }
    return this.profilesService.updateResume(
      user.id,
      file.path,
      file.originalname,
    );
  }

  @Get(':userId')
  async getProfile(
    @Param('userId') targetUserId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.profilesService.getProfileByUserId(targetUserId, user?.role);
  }
}
