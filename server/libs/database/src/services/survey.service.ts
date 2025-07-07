import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Survey } from "../entities/survey.entity";

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
  ) {}
  async getAll(userId:string): Promise<Survey[]> {
    const Surveys= await this.surveyRepo.find({
      where:{ user:{id:userId}}
    })
    return Surveys;
  }
  async createSurvey(data: {
    questionnaireId: string;
    populationId: string;
    userId:string;
    deliveryModes: ('email' | 'whatsapp')[];
    expiresAt: Date;
  }): Promise<Survey> {
    const survey = this.surveyRepo.create({
      questionnaire: { id: data.questionnaireId },
      population: { id: data.populationId },
      user:{id:data.userId},
      deliveryModes: data.deliveryModes,
      expiresAt: data.expiresAt,
    });

    return this.surveyRepo.save(survey);
  }

  async markAnalyzed(surveyId: string): Promise<void> {
    await this.surveyRepo.update({ id: surveyId }, { analyzed: true });
  }

  async getSurveyById(id: string): Promise<Survey | null> {
    return this.surveyRepo.findOne({ where: { id }, relations: ['questionnaire', 'population'] });
  }

  async getAllSurveys(): Promise<Survey[]> {
    return this.surveyRepo.find({ relations: ['questionnaire', 'population'] });
  }

  async getExpiredSurveys(): Promise<Survey[]> {
    const now = new Date();
    return this.surveyRepo.find({
      where: {
        expiresAt: LessThan(now),
        analyzed: false,
      },
      relations: ['questionnaire', 'population'],
    });
  }

  async updateSendJobStatus(
    surveyId: string, 
    status: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed',
    jobId?: string,
    progress?: number
  ): Promise<void> {
    const updateData: any = { sendJobStatus: status };
    
    if (jobId) {
      updateData.sendJobId = jobId;
    }
    
    if (progress !== undefined) {
      updateData.sendProgress = progress;
    }
    
    if (status === 'Processing' && !jobId) {
      updateData.sendJobStartedAt = new Date();
    }
    
    if (status === 'Completed' || status === 'Failed') {
      updateData.sendJobCompletedAt = new Date();
    }
    
    await this.surveyRepo.update({ id: surveyId }, updateData);
  }

  async getSurveyJobStatus(surveyId: string): Promise<{
    sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';
    sendJobId?: string;
    sendProgress: number;
    sendJobStartedAt?: Date;
    sendJobCompletedAt?: Date;
  } | null> {
    const survey = await this.surveyRepo.findOne({
      where: { id: surveyId },
      select: ['sendJobStatus', 'sendJobId', 'sendProgress', 'sendJobStartedAt', 'sendJobCompletedAt']
    });
    
    return survey ? {
      sendJobStatus: survey.sendJobStatus,
      sendJobId: survey.sendJobId,
      sendProgress: survey.sendProgress,
      sendJobStartedAt: survey.sendJobStartedAt,
      sendJobCompletedAt: survey.sendJobCompletedAt
    } : null;
  }
}
