import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('register')
  async create(
    @Body() body: AdminRegisterDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.register(body, user?.role);
  }

  @Public()
  @Post('login')
  async login(@Body() body: AdminLoginDto) {
    return this.adminService.signIn(body);
  }

  @Roles('admin')
  @Get('stats')
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Roles('admin')
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'suspended',
  ) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Roles('admin')
  @Patch('companies/:id/status')
  async updateCompanyStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'suspended',
  ) {
    return this.adminService.updateCompanyStatus(id, status);
  }
}
