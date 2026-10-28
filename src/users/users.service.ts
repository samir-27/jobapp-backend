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
import { SignupUserDto } from './dto/signup-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getJwtSecret } from '../auth/jwt.config';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(userData: SignupUserDto): Promise<{ message: string }> {
    const { name, email, password, ...optionalFields } = userData;

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
      ...optionalFields,
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

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id.toString(), type: 'user', role: 'user', email: user.email },
      getJwtSecret(),
      { expiresIn: '1d' },
    );

    return { token, userId: user._id.toString() };
  }

  async updateUser(
    id: string,
    updateUsersDto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    const updatePayload: Record<string, any> = { ...updateUsersDto };

    if (updatePayload.image) {
      updatePayload.profileImg = updatePayload.image;
      delete updatePayload.image;
    }

    if (file) {
      updatePayload.profileImg = file.path;
    }

    if (updatePayload.password) {
      if (!updatePayload.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      const user = await this.userModel.findById(id).select('+password');
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordMatching = bcrypt.compareSync(
        updatePayload.currentPassword,
        user.password,
      );
      if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password');
      }

      updatePayload.password = bcrypt.hashSync(updatePayload.password, 10);
      delete updatePayload.currentPassword;
    } else {
      delete updatePayload.currentPassword;
    }

    // Never allow updating privileged fields
    delete updatePayload._id;
    delete updatePayload.appliedJobs;
    delete updatePayload.email;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
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

  async findAll(page: number = 1, limit: number = 50): Promise<User[]> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    return this.userModel
      .find()
      .select('-password')
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .exec();
  }

  async deleteUser(id: string): Promise<{ deleted: boolean; message: string }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { deleted: true, message: 'User deleted successfully' };
  }
}
