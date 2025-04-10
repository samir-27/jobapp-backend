import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './companies.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageStorage } from 'cloudinary.config';
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Post('signup')
  async signup(@Body() body: any) {
    return this.companiesService.signup(body);
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

    @Delete(':id')
    deleteCompany(@Param('id') id: string) {
      return this.companiesService.deleteCompany(id);
    }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
