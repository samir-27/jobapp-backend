import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStage } from '../applyJobs.schema';

export class UpdateApplicationStageDto {
  @IsEnum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
