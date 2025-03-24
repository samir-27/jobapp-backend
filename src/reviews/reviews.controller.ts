import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() reviewData: any) {
    return this.reviewService.create(reviewData);
  }

  @Get()
  async findAll() {
    return this.reviewService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.reviewService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reviewService.delete(id);
  }
}