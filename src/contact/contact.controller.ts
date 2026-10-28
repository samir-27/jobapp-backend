import { Body, Controller, Post, Req } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';
import { Public } from '../auth/public.decorator';
import { Request } from 'express';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  async submit(@Body() body: ContactDto, @Req() req: Request) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    return this.contactService.submit(body, clientIp);
  }
}
