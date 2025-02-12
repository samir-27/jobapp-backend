import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApplyJobService } from "./applyJob.service";

@Controller("applyjob")
export class ApplyJobController {
  constructor(private readonly applyJobService: ApplyJobService) {}

  @Post("create")
  async create(
    @Body() body: { fullName: string; phone: string; address: string; education: string; course: string  }
  ) {
    return this.applyJobService.create(body);
  }

  @Get("user/:userId")
  async findByUser(@Param("userId") userId: string) {
    return this.applyJobService.findByUser(userId);
  }

}
