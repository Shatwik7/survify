import { IsObject, IsString } from 'class-validator';

export class SubmitAnswersDto {
  @IsString()
  jwt: string;

  @IsObject()
  answers: { [questionId: string]: string[] };
} 