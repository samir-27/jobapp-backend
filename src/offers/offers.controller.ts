import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Roles('company')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.offersService.create(dto, user.id);
  }

  @Get()
  async getMyOffers(@CurrentUser() user: AuthenticatedUser) {
    return this.offersService.getMyOffers(user.id, user.role);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.offersService.findOne(id, user.id, user.role);
  }

  @Roles('user')
  @Patch(':id/respond')
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.offersService.respond(id, dto, user.id);
  }

  @Roles('company')
  @Patch(':id/rescind')
  async rescind(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.offersService.rescind(id, user.id);
  }
}
