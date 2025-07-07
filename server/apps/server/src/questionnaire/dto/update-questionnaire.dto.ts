import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionnaireDto } from './create-questionnaire.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateQuestionnaireDto extends PartialType(CreateQuestionnaireDto) {
    @IsOptional()
    @IsEnum(['draft', 'queued', 'completed', 'failed'])
    status?: 'draft' | 'queued' | 'completed' | 'failed';
}
