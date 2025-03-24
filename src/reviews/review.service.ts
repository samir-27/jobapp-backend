import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './reviews.schema';

@Injectable()
export class ReviewService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}

  async create(reviewData: any): Promise<Review> {
    const newReview = new this.reviewModel(reviewData);
    return newReview.save();
  }

  async findAll(): Promise<Review[]> {
    return this.reviewModel.find().populate('userId').exec();
  }

  async update(id: string, updateData: any): Promise<Review> {
    const updatedReview = await this.reviewModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }
    return updatedReview;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.reviewModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Review not found');
    }
    return { deleted: true };
  }
}