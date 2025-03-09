import { Controller, Post, Body, Patch, Param, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.schema';
// import { upload } from 'cloudinary.config'
import { profileImageStorage } from 'cloudinary.config';


import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.usersService.signup(body.name, body.email, body.password);
  }

  @Post('signin')
  async signin(@Body() body: { email: string; password: string }) {
    return this.usersService.signin(body.email, body.password);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('profileImg', { storage: profileImageStorage }))
  async updateUser(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUsersDto: Partial<User>,
  ) {
    return this.usersService.updateUser(id, updateUsersDto, file);
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.usersService.findOne(id)
  }

}