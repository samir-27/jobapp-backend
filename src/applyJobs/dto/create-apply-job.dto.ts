import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateApplyJobDto {
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullname?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Phone must be a 10-digit number' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsNotEmpty()
  @IsEnum(['diploma', 'graduation', 'post-graduation'], {
    message: 'Education must be diploma, graduation, or post-graduation',
  })
  education: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  course: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImg?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}
