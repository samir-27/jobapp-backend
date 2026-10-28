import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return value;
  })
  @IsArray()
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  @Max(10000000)
  salary?: number;

  @IsOptional()
  @IsEnum(['fresher', '1-3years', '3-5years', '5-10years', '10-20years'])
  experience?: string;

  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'on-site'])
  location?: string;

  @IsOptional()
  @IsEnum(['Full-Time', 'Part-Time', 'Contract'])
  jobType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  responsibilities?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  requirements?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  niceToHave?: string[];

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'closed', 'archived'])
  status?: string;
}
