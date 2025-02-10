import { Body, Controller, Post } from "@nestjs/common";
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
}
