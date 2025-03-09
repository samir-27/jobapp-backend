import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyJobDto {
    @IsNotEmpty()
    @IsString()
    jobId: string;

    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    course: string;

    @IsNotEmpty()
    @IsString()
    education: string;

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsString()
    fullname: string;
}
