import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApplyJobService } from "./applyJob.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { resumeStorage } from 'cloudinary.config';

@Controller("applyjob")
export class ApplyJobController {
  constructor(private readonly applyJobService: ApplyJobService) {}

  @Post("create")
  @UseInterceptors(FileInterceptor('resume', { storage: resumeStorage }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { 
      userId: string; 
      jobId: string; 
      fullName: string; 
      phone: string; 
      address: string; 
      education: string; 
      course: string;
    }
  ) {
    console.log("apply job body:",body)
    return this.applyJobService.create(body, file);
  }
  

  @Get("user/:userId")
  async findByUser(@Param("userId") userId: string) {
    return this.applyJobService.findByUser(userId);
  }

  @Get("job/:jobId")
  async findByJob(@Param("jobId") jobId: string ){
    return this.applyJobService.findByJob(jobId)
  }

}
