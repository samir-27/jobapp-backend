import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  role: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return value;
  })
  @IsArray()
  skills: string[];

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  @Max(10000000)
  salary: number;

  @IsNotEmpty()
  @IsEnum(['fresher', '1-3years', '3-5years', '5-10years', '10-20years'])
  experience: string;

  @IsNotEmpty()
  @IsEnum(['remote', 'hybrid', 'on-site'])
  location: string;

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
  companyName?: string; // accepted from client but not stored directly as foreign key

  @IsOptional()
  @IsEnum(['draft', 'published', 'closed', 'archived'])
  status?: string;
}
