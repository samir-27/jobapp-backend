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

  async updateUser(id: string, updateUsersDto: Partial<User> & { currentPassword?: string }): Promise<User> {
 
    if (updateUsersDto.password) {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
  
      const isPasswordMatching = bcrypt.compareSync(updateUsersDto.currentPassword, user.password);
      if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password');
      }
  
      updateUsersDto.password = bcrypt.hashSync(updateUsersDto.password, 10);
    }
  
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUsersDto },
      { new: true, runValidators: true }
    );
  
    if (!updatedUser) {
      throw new BadRequestException('User not found');
    }
  
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
