import { Module } from '@nestjs/common';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { SurveyModule } from './survey/survey.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PopulationModule } from './population/population.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: 6379,
        },
      }),
    }),
    PopulationModule,
    QuestionnaireModule,
    SurveyModule,
    UserModule],
})
export class AppModule { }
