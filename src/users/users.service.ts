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

  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<{ message: string }> {
    if (!name || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const existingUserByUsername = await this.userModel.findOne({ name });
    if (existingUserByUsername) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
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
    updateUsersDto: Partial<User> & { currentPassword?: string; image?: string }, // ✅ Add 'image' field
    file?: Express.Multer.File,
  ): Promise<User> {
    console.log("🔹 Received update request for user:", id);
    console.log("🔹 Data received from frontend:", updateUsersDto);
    console.log("🔹 File received:", file ? file.path : "No file uploaded");
  
    // ✅ Check if 'image' is provided in the request
    if (updateUsersDto.image) {
      updateUsersDto.profileImg = updateUsersDto.image;
      delete updateUsersDto.image; // Remove redundant field
      console.log("🔹 Assigned profileImg from frontend image field:", updateUsersDto.profileImg);
    }
  
    if (file) {
      updateUsersDto.profileImg = file.path; // Cloudinary image URL
      console.log("🔹 Assigned profileImg from uploaded file:", file.path);
    }
  
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUsersDto },
      { new: true, runValidators: true }
    );
  
    if (!updatedUser) {
      console.error("❌ User not found for ID:", id);
      throw new BadRequestException('User not found');
    }
  
    console.log("✅ User updated successfully:", updatedUser);
    return updatedUser;
  }
  
  
  
  
  

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with UserID ${id} not found`);
    }
    return user;
  }
}                     