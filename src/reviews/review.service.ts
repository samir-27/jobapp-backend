import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './reviews.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}

  async create(reviewData: CreateReviewDto, userId: string): Promise<Review> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const newReview = new this.reviewModel({
      ...reviewData,
      userId: new Types.ObjectId(userId),
    });
    return newReview.save();
  }

  async findAll(): Promise<Review[]> {
    // Populate ONLY safe public user fields (never password hashes or private contact details)
    return this.reviewModel
      .find()
      .populate('userId', 'name fullname profileImg')
      .exec();
  }

  async update(
    id: string,
    updateData: UpdateReviewDto,
    actorId: string,
    actorRole: string,
  ): Promise<Review> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (actorRole !== 'admin' && review.userId.toString() !== actorId) {
      throw new ForbiddenException('You are not authorized to edit this review');
    }

    const updatedReview = await this.reviewModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }
    return updatedReview;
  }

  async delete(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (actorRole !== 'admin' && review.userId.toString() !== actorId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    await this.reviewModel.findByIdAndDelete(id);
    return { deleted: true, message: 'Review deleted successfully' };
  }
}
