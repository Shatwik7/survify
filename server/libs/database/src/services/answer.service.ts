import { Repository } from "typeorm";
import { Answer } from "../entities/answer.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Survey } from "../entities/survey.entity";
import { Questionnaire } from "../entities/questionnaire.entity";
import { Population } from "../entities/population.entity";
import { Person } from "../entities/person.entity";
import { ReadStream } from "typeorm/platform/PlatformTools";

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
  ) { }

  async submitAnswers(data: {
    surveyId: string;
    personId: string;
    answers: { [questionId: string]: string[] };
  }): Promise<void> {
    const entities = Object.entries(data.answers).map(([questionId, values]) =>
      this.answerRepo.create({
        survey: { id: data.surveyId },
        person: { id: data.personId },
        question: { id: questionId },
        value: values,
      }),
    );

    await this.answerRepo.save(entities);
  }

  async getAnswersBySurvey(surveyId: string, page: number = 1, limit: number = 50): Promise<Answer[]> {
    return this.answerRepo.find({
      where: { survey: { id: surveyId } },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  async getAnswersByStreaming(surveyId: string): 
  Promise<{
    stream: Promise<ReadStream>;
    release: () => Promise<void>;
  }>{
    const queryRunner = this.answerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();

    const rawQuery = `
            SELECT 
              a.id as answer_id,
              a.value as answer,
              a."createdAt" as answered_at,
              p.email as person_email,
              p.name as person_name,
              q.description as question,
              q.type as question_type
            FROM answer a
            JOIN question q ON q.id = a."questionId"
            JOIN person p ON p.id = a."personId"
            JOIN survey s ON s.id = a."surveyId"
            WHERE a."surveyId" = $1
    `;

    const dbStream = queryRunner.stream(rawQuery, [surveyId]);

    // Return the stream and handle cleanup
    return {
      stream: dbStream,
      release: () => queryRunner.release()
    };
  }
}
