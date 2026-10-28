import { IsEnum } from 'class-validator';
import { JobStatus } from '../jobs.schema';

export class UpdateJobStatusDto {
  @IsEnum(['draft', 'published', 'closed', 'archived'])
  status: JobStatus;
}
