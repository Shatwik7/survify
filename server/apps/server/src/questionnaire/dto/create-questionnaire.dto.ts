import { IsString } from 'class-validator';

export class CreateQuestionnaireDto {
    @IsString()
    title: string;

    @IsString()
    description: string;
}
