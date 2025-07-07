import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { SurveyAnalysisProcessor } from './processor/survey-analysis.processor';
import { EmailProcessor } from './email.processor';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'jwt-secret',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') || '1d' },
      }),
    }),
    BullModule.registerQueue(
      {
        name: 'survey-analysis',
      },
      {
        name: 'email-service',
      }
    ),
  ],
  controllers: [SurveyController],
  providers: [SurveyService, SurveyAnalysisProcessor, EmailProcessor],
  exports: [SurveyService],
})
export class SurveyModule {} 