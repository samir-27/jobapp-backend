import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './companies.schema';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<{ message: string }> {
    if (!name || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const existingEmail = await this.companyModel.findOne({ email });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const existingCompanyByName = await this.companyModel.findOne({ name });
    if (existingCompanyByName) {
      throw new BadRequestException('Company name already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newCompany = new this.companyModel({
      name,
      email,
      password: hashedPassword,
    });
    console.log(newCompany);
    await newCompany.save();

    return { message: 'Signup successful' };
  }
  
  async signin(email: string, password: string): Promise<{ token: string, companyId: string }> {
    if (!email || !password) {
      throw new BadRequestException('All fields are required');
    }
  
    const company = await this.companyModel.findOne({ email });
    if (!company) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    const passwordMatches = bcrypt.compareSync(password, company.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    const token = jwt.sign(
      { id: company._id.toString(), type: 'company' },  // Convert ObjectId to string
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  
    return { token, companyId: company._id.toString() };  // Ensure companyId is a string
  }
  
  
  
}
