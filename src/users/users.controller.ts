import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.schema';

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
  updateUser(@Param('id') id: string, @Body() updateUsersDto: Partial<User>) {
    return this.usersService.updateUser(id, updateUsersDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.usersService.findOne(id)
  }

}
