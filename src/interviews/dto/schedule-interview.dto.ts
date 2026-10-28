import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ScheduleInterviewDto {
  @IsMongoId()
  applicationId: string;

  @IsString()
  @MaxLength(150)
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(['remote', 'in-person', 'phone'])
  mode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString({ each: true })
  interviewers?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
