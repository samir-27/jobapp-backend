import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from './users.schema';
import { promises } from 'dns';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(userData: {
    name: string;
    email: string;
    password: string;
    fullname?: string;
    phone?: string;
    education?: string;
    course?: string;
    address?: string;
    city?: string;
    pincode?: string;
    state?: string;
  }): Promise<{ message: string }> {
    const { name, email, password, ...optionalFields } = userData;
  
    // Validate required fields
    if (!name || !email || !password) {
      throw new BadRequestException('Name, email, and password are required');
    }
  
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
  
    // Check if username already exists
    const existingUserByUsername = await this.userModel.findOne({ name });
    if (existingUserByUsername) {
      throw new BadRequestException('Username already exists');
    }
  
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
  
    // Create new user with all fields
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
      ...optionalFields, // Spread additional optional fields
    });
  
    await newUser.save();
    return { message: 'Signup successful' };
  }
  

  async signin(
    email: string,
    password: string,
  ): Promise<{ token: string; userId: string }> {
    if (!email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id.toString(), type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    return { token, userId: user._id.toString() };
  }

  async updateUser(
    id: string,
    updateUsersDto: Partial<User> & {
      currentPassword?: string;
      image?: string;
    },
    file?: Express.Multer.File,
  ): Promise<User> {
    // console.log('Received update request for user:', id);
    // console.log('Data received from frontend:', updateUsersDto);
    // console.log('File received:', file ? file.path : 'No file uploaded');
  
    // Handle image upload if present
    if (updateUsersDto.image) {
      updateUsersDto.profileImg = updateUsersDto.image;
      delete updateUsersDto.image; // Remove redundant field
    }
  
    if (file) {
      updateUsersDto.profileImg = file.path; // Cloudinary image URL
    }
  
    // Handle password update if present
    if (updateUsersDto.password) {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
  
      const isPasswordMatching = bcrypt.compareSync(updateUsersDto.currentPassword, user.password);
      if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password');
      }
  
      updateUsersDto.password = bcrypt.hashSync(updateUsersDto.password, 10); // Hash new password
    }
  
    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: updateUsersDto }, { new: true, runValidators: true });
  
    if (!updatedUser) {
      console.error('User not found for ID:', id);
      throw new BadRequestException('User not found');
    }
  
    // console.log('User updated successfully:', updatedUser);
    return updatedUser;
  }
  

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with UserID ${id} not found`);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }
}                     