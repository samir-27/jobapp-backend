import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './companies.schema';
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}
  @Post('signup')
  async signup(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.companiesService.signup(body.name, body.email, body.password);
  }

  @Post('signin')
  async signin(@Body() body: { email: string; password: string }) {
    return this.companiesService.signin(body.email, body.password);
  }

  @Patch(':id')
  updateCompany(@Param('id') id: string, @Body() updateCompaniesDto: Partial<Company>) {
    return this.companiesService.updateCompany(id, updateCompaniesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
