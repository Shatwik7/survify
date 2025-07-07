import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { BullModule } from '@nestjs/bull';
import { PromptProcessor } from './processor/prompt.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'openai-questionnare-generator',
    }),
    DatabaseModule,
    AuthModule],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, PromptProcessor],
})
export class QuestionnaireModule { }
