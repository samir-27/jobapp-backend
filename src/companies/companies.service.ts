import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './companies.schema';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { SignupCompanyDto } from './dto/signup-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { getJwtSecret } from '../auth/jwt.config';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async signup(companyData: SignupCompanyDto): Promise<{ message: string }> {
    const { name, email, password, ...optionalFields } = companyData;

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
      ...optionalFields,
    });

    await newCompany.save();
    return { message: 'Signup successful' };
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{ token: string; companyId: string }> {
    if (!email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const company = await this.companyModel.findOne({ email }).select('+password');
    if (!company) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = bcrypt.compareSync(password, company.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      {
        id: company._id.toString(),
        type: 'company',
        role: 'company',
        email: company.email,
      },
      getJwtSecret(),
      { expiresIn: '1d' },
    );

    return { token, companyId: company._id.toString() };
  }

  async updateCompany(
    id: string,
    updateCompaniesDto: UpdateCompanyDto,
    file?: Express.Multer.File,
  ): Promise<Company> {
    const updatePayload: Record<string, any> = { ...updateCompaniesDto };

    if (updatePayload.image) {
      updatePayload.logo = updatePayload.image;
      delete updatePayload.image;
    }

    if (file) {
      updatePayload.logo = file.path;
    }

    if (updatePayload.password) {
      if (!updatePayload.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      const company = await this.companyModel.findById(id).select('+password');
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const isPasswordMatching = bcrypt.compareSync(
        updatePayload.currentPassword,
        company.password,
      );
      if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password');
      }

      updatePayload.password = bcrypt.hashSync(updatePayload.password, 10);
      delete updatePayload.currentPassword;
    } else {
      delete updatePayload.currentPassword;
    }

    delete updatePayload._id;

    const updatedCompany = await this.companyModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return updatedCompany;
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel.findById(id).select('-password').exec();
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async findAll(page: number = 1, limit: number = 50): Promise<Company[]> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    return this.companyModel
      .find()
      .select('-password')
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .exec();
  }

  async deleteCompany(id: string): Promise<{ deleted: boolean; message: string }> {
    const result = await this.companyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return { deleted: true, message: 'Company deleted successfully' };
  }
}
