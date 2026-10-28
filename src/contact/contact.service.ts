import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './contact.schema';
import { ContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private recentRequests: Map<string, number[]> = new Map();

  constructor(@InjectModel(Contact.name) private contactModel: Model<ContactDocument>) {}

  checkRateLimit(ip: string): void {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    const timestamps = (this.recentRequests.get(ip) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      throw new HttpException(
        'Too many contact requests. Please wait a moment before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    timestamps.push(now);
    this.recentRequests.set(ip, timestamps);
  }

  async submit(data: ContactDto, clientIp: string): Promise<{ success: boolean; message: string }> {
    this.checkRateLimit(clientIp);
    const newContact = new this.contactModel(data);
    await newContact.save();
    return {
      success: true,
      message: 'Thank you for reaching out. Your message has been received.',
    };
  }
}
