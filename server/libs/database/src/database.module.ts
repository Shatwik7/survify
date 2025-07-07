import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Question } from "./entities/question.entity";
import { Questionnaire } from "./entities/questionnaire.entity";
import { UserService } from "./services/users.service";
import { QuestionDBService } from "./services/question.service";
import { QuestionnaireDBService } from "./services/questionnaire.service";
import { ConfigService } from "@nestjs/config";
import { Person } from "./entities/person.entity";
import { Population } from "./entities/population.entity";
import { PersonDBService } from "./services/person.service";
import { PopulationDBService } from "./services/population.service";
import { Answer } from "./entities/answer.entity";
import { Survey } from "./entities/survey.entity";
import { SurveyAccess } from "./entities/survey-access.entity";
import { SurveyService } from "./services/survey.service";
import { SurveyAccessService } from "./services/survey-access.service";
import { AnswerService } from "./services/answer.service";

@Module({
  imports: [
     TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [User, Question, Questionnaire, Person, Population, Answer, Survey, SurveyAccess],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Question, Questionnaire, Person, Population, Answer, Survey, SurveyAccess])
  ],
  providers: [UserService, QuestionDBService, QuestionnaireDBService, PersonDBService, PopulationDBService, SurveyService, SurveyAccessService, AnswerService],
  exports: [UserService, QuestionDBService, QuestionnaireDBService, PersonDBService, PopulationDBService, SurveyService, SurveyAccessService, AnswerService],
})
export class DatabaseModule {}
