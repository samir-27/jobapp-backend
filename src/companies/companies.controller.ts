import { Body, Controller, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
      constructor(private readonly companiesService: CompaniesService) {}
        @Post('signup')
        async signup(@Body() body: { name: string, email: string, password: string }) {
          return this.companiesService.signup(body.name, body.email, body.password);
        }
      
        @Post('signin')
        async signin(@Body() body: { email: string, password: string }) {
          return this.companiesService.signin(body.email, body.password);
        }
}
