import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './companies.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageStorage } from 'cloudinary.config';
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
  @UseInterceptors(FileInterceptor('logo', { storage: profileImageStorage }))
  async updateCompany(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
     @Body() updateCompaniesDto: Partial<Company>) 
     {
    return this.companiesService.updateCompany(id, updateCompaniesDto,file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
