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

  async signin(
    email: string,
    password: string,
  ): Promise<{ token: string; companyId: string }> {
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
      { id: company._id.toString(), type: 'company' }, // Convert ObjectId to string
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    return { token, companyId: company._id.toString() }; // Ensure companyId is a string
  }

  async updateCompany(
    id: string,
    updateCompaniesDto: Partial<Company> & {
      currentPassword?: string;
      image?: string;
    },
    file?: Express.Multer.File,
  ): Promise<Company> {
    console.log('image?', updateCompaniesDto.image);

    console.log('Received DTO:', updateCompaniesDto);

    if (updateCompaniesDto.image) {
      console.log(
        '🔹 Received image URL from frontend:',
        updateCompaniesDto.image,
      );
      updateCompaniesDto.logo = updateCompaniesDto.image;
      delete updateCompaniesDto.image;
    } else if (file) {
      console.log('🔹 Received file from multer:', file.path);
      updateCompaniesDto.logo = file.path;
    }

    console.log('🔹 Final logo:', updateCompaniesDto.logo);

    // if (updateCompaniesDto.image) {
    //   updateCompaniesDto.logo = updateCompaniesDto.image;
    //   delete updateCompaniesDto.image; // Remove redundant field
    //   console.log(
    //     '🔹 Assigned logo from frontend image field:',
    //     updateCompaniesDto.logo,
    //   );
    // }

    if (file) {
      updateCompaniesDto.logo = file.path; // Cloudinary image URL
      console.log('🔹 Assigned logo from uploaded file:', file.path);
    }
    if (updateCompaniesDto.password) {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new BadRequestException('Company not found');
      }

      const isPasswordMatching = bcrypt.compareSync(
        updateCompaniesDto.currentPassword,
        company.password,
      );
      if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password');
      }

      updateCompaniesDto.password = bcrypt.hashSync(
        updateCompaniesDto.password,
        10,
      );
    }

    const updatedCompany = await this.companyModel.findByIdAndUpdate(
      id,
      { $set: updateCompaniesDto },
      { new: true, runValidators: true }
    );
    
    console.log("Updated company:", updatedCompany);
    
    if (!updatedCompany) {
      throw new BadRequestException('Company not found');
    }

    return updatedCompany;
  }

  async findOne(id: string): Promise<Company> {
    const user = await this.companyModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Company with CompanyID ${id} not found`);
    }
    return user;
  }
}
