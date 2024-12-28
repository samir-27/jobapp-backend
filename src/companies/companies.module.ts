import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './companies.schema';

@Module({
    imports:[
      MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])
    ],
  controllers: [CompaniesController],
  providers: [CompaniesService]
})
export class CompaniesModule {}
