import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async signup(username: string, email: string, password: string): Promise<string> {
    if (!username || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const existingUserByUsername = await this.userModel.findOne({ username });
    if (existingUserByUsername) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new this.userModel({ username, email, password: hashedPassword });
    await newUser.save();
    return 'Signup successful';
  }

  async signin(email: string, password: string): Promise<string> {
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: '1h' });
    return token;
  }
}
