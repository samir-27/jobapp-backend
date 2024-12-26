import { Controller, Post, Body} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() body: { username: string, email: string, password: string }) {
    return this.usersService.signup(body.username, body.email, body.password);
  }

  @Post('signin')
  async signin(@Body() body: { email: string, password: string }) {
    return this.usersService.signin(body.email, body.password);
  }
}

