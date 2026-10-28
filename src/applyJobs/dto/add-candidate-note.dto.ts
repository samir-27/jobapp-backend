import { IsString, MaxLength } from 'class-validator';

export class AddCandidateNoteDto {
  @IsString()
  @MaxLength(2000)
  content: string;
}
