import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Roles('user')
  @Post()
  async create(
    @Body() reviewData: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewService.create(reviewData, user.id);
  }

  @Public()
  @Get()
  async findAll() {
    return this.reviewService.findAll();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewService.update(id, updateData, user.id, user.role);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewService.delete(id, user.id, user.role);
  }
}
