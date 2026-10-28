import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveJobDto {
  @IsMongoId()
  jobId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
