import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageStorage } from 'cloudinary.config';
import { Public } from '../auth/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { SignupCompanyDto } from './dto/signup-company.dto';
import { SigninCompanyDto } from './dto/signin-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.companiesService.findAll(page, limit);
  }

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupCompanyDto) {
    return this.companiesService.signup(body);
  }

  @Public()
  @Post('signin')
  async signin(@Body() body: SigninCompanyDto) {
    return this.companiesService.signin(body.email, body.password);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: profileImageStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateCompany(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateCompaniesDto: UpdateCompanyDto,
  ) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You are not authorized to update this company');
    }
    return this.companiesService.updateCompany(id, updateCompaniesDto, file);
  }

  @Delete(':id')
  deleteCompany(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You are not authorized to delete this company');
    }
    return this.companiesService.deleteCompany(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
