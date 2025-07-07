import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    @MinLength(10)
    description: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsEnum(['text', 'number', 'date', 'select', 'checkbox', 'radio'])
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];
}
