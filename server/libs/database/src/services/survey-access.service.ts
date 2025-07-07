import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyAccess } from "../entities/survey-access.entity";
import { Person } from "../entities/person.entity";
import { Survey } from "../entities/survey.entity";

@Injectable()
export class SurveyAccessService {
  constructor(
    @InjectRepository(SurveyAccess)
    private surveyAccessRepo: Repository<SurveyAccess>,
  ) {}



  async createAccess(surveyId: string, personId: string, jwtToken: string): Promise<SurveyAccess> {
    const access = this.surveyAccessRepo.create({
      survey: { id: surveyId },
      person: { id: personId },
      jwtToken,
    });
    return this.surveyAccessRepo.save(access);
  }

  async findByJwtToken(jwtToken: string): Promise<SurveyAccess | null> {
    return this.surveyAccessRepo.findOne({
      where: { jwtToken },
      relations: ['survey', 'survey.questionnaire', 'survey.questionnaire.questions', 'person'],
    });
  }

  async markAsSeen(jwtToken: string): Promise<void> {
    const access = await this.surveyAccessRepo.findOne({ where: { jwtToken } });
    if (!access) {
      throw new NotFoundException('Survey access not found');
    }
    
    if (!access.seen) {
      access.seen = true;
      access.seenAt = new Date();
      await this.surveyAccessRepo.save(access);
    }
  }

  async markAsCompleted(jwtToken: string): Promise<void> {
    const access = await this.surveyAccessRepo.findOne({ where: { jwtToken } });
    if (!access) {
      throw new NotFoundException('Survey access not found');
    }
    
    access.completed = true;
    access.completedAt = new Date();
    await this.surveyAccessRepo.save(access);
  }

  async getAccessBySurvey(surveyId: string): Promise<SurveyAccess[]> {
    return this.surveyAccessRepo.find({
      where: { survey: { id: surveyId } },
      relations: ['person'],
    });
  }

  async getAccessStats(surveyId: string): Promise<{
    total: number;
    seen: number;
    completed: number;
  }> {
    const [total, seen, completed] = await Promise.all([
      this.surveyAccessRepo.count({ where: { survey: { id: surveyId } } }),
      this.surveyAccessRepo.count({ where: { survey: { id: surveyId }, seen: true } }),
      this.surveyAccessRepo.count({ where: { survey: { id: surveyId }, completed: true } }),
    ]);

    return { total, seen, completed };
  }
} 