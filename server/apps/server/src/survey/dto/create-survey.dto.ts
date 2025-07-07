import { IsArray, IsDateString, IsEnum, IsString, IsUUID, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class CreateSurveyDto {
  @IsUUID()
  @IsNotEmpty()
  questionnaireId: string;

  @IsUUID()
  @IsNotEmpty()
  populationId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(['email', 'whatsapp'], { each: true })
  deliveryModes: ('email' | 'whatsapp')[];

  @IsDateString()
  @IsNotEmpty()
  expiresAt: Date;
} 