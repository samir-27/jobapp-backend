import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondOfferDto {
  @IsEnum(['accepted', 'rejected'])
  response: 'accepted' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
