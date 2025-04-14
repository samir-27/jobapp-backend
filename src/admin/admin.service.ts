import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './admin.schema';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async register(email: string, password: string): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const newAdmin = new this.adminModel({
      email,
      password: hashedPassword,
    });
  
    return newAdmin.save();
  }
  async signIn(email: string, password: string): Promise<Admin> {
    const admin = await this.adminModel.findOne({ email }).exec();
    // console.log('Admin found:', admin);
  
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    const isMatch = await bcrypt.compare(password, admin.password);
    // console.log('Password match:', isMatch);
  
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    return admin;
  }

  //hardcoded admin creation on startup

//   async onModuleInit() {
//     await this.createHardcodedAdmin();
//   }

//   private async createHardcodedAdmin() {
//     const email = 'samir@gmail.com';
//     const password = 'samir1234';

//     const exists = await this.adminModel.findOne({ email });
//     if (exists) {
//       console.log(' Admin already exists. Skipping creation.');
//       return;
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newAdmin = new this.adminModel({ email, password: hashedPassword });
//     await newAdmin.save();

//     console.log(` Admin created on startup: ${email}`);
//   }
}
