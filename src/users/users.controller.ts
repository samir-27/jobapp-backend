import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { profileImageStorage } from 'cloudinary.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { SignupUserDto } from './dto/signup-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page, limit);
  }

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupUserDto) {
    return this.usersService.signup(body);
  }

  @Public()
  @Post('signin')
  async signin(@Body() body: SigninUserDto) {
    return this.usersService.signin(body.email, body.password);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('profileImg', {
      storage: profileImageStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
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
  async updateUser(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUsersDto: UpdateUserDto,
  ) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You are not authorized to update another user profile');
    }
    return this.usersService.updateUser(id, updateUsersDto, file);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You are not authorized to view another user profile');
    }
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You are not authorized to delete another user profile');
    }
    return this.usersService.deleteUser(id);
  }
}
