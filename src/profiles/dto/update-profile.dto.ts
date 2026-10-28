import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkExperienceDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(100)
  company: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class EducationDto {
  @IsString()
  @MaxLength(150)
  institution: string;

  @IsString()
  @MaxLength(100)
  degree: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldOfStudy?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;
}

export class SocialLinksDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  github?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  portfolio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  twitter?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  experience?: WorkExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredRoles?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedSalary?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'on-site', 'any'])
  workPreference?: string;
}
