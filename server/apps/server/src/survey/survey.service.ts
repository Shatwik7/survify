import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { SurveyService as SurveyDBService, SurveyAccessService, PersonDBService, PopulationDBService, QuestionnaireDBService, AnswerService, Survey, Answer } from '@app/database';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SurveyWithQuestionsDto } from './dto/survey-with-questions.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UUID } from 'crypto';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    private readonly surveyDBService: SurveyDBService,
    private readonly surveyAccessService: SurveyAccessService,
    private readonly personDBService: PersonDBService,
    private readonly populationDBService: PopulationDBService,
    private readonly questionnaireDBService: QuestionnaireDBService,
    private readonly answerService: AnswerService,
    private readonly jwtService: JwtService,
    @InjectQueue('survey-analysis') private readonly analysisQueue: Queue,
    @InjectQueue('email-service') private readonly emailQueue: Queue,
  ) { }

  async createSurvey(dto: CreateSurveyDto, userId: string): Promise<Survey> {
    // Validate questionnaire exists
    const questionnaire = await this.questionnaireDBService.findById(dto.questionnaireId);
    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Validate population exists
    const population = await this.populationDBService.getPopulation(dto.populationId);
    if (!population) {
      throw new NotFoundException('Population not found');
    }

    // Validate deliveryModes
    if (!Array.isArray(dto.deliveryModes) || dto.deliveryModes.length === 0) {
      throw new BadRequestException('deliveryModes must be a non-empty array');
    }

    // Robust expiresAt handling
    let expiresAt: Date;
    if (dto.expiresAt instanceof Date) {
      expiresAt = dto.expiresAt;
    } else if (typeof dto.expiresAt === 'string') {
      expiresAt = new Date(dto.expiresAt);
    } else {
      throw new BadRequestException('Invalid expiresAt');
    }
    if (isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt');
    }

    // Create the survey
    const survey = await this.surveyDBService.createSurvey({
      questionnaireId: dto.questionnaireId,
      populationId: dto.populationId,
      userId: userId,
      deliveryModes: dto.deliveryModes,
      expiresAt,
    });

    this.logger.log(`Survey created with ID: ${survey.id}`);
    return survey;
  }

  async sendSurveyLinks(surveyId: string): 
  Promise<{ 
    sendJobStatus: 'Queued'; 
    sendJobId: UUID; 
    sendProgress: number; 
    sendJobStartedAt: number; 
    sendJobCompletedAt?: number; 
  }> {
    const survey = await this.surveyDBService.getSurveyById(surveyId);
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }
    const jobId = crypto.randomUUID();
    await this.surveyDBService.updateSendJobStatus(surveyId, 'Queued', jobId);
    const job = await this.emailQueue.add('send-survey-emails', {
      surveyId,
      populationId: survey.populationId,
      deliveryModes: survey.deliveryModes,
      surveyTitle: survey.questionnaire?.title || 'Survey',
      page: 1,
      lastProcessedIndex: 0,
      totalPersons: 0,
      pageSize: 100
    }, {
      jobId: jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
    });

    this.logger.log(`Enqueued email processing job for survey ${surveyId} with population ${survey.populationId}, job ID: ${job.id}`);
    return {
      sendJobStatus: 'Queued',
      sendJobId: jobId,
      sendProgress: 0,
      sendJobStartedAt: Date.now(),
      sendJobCompletedAt: undefined,
    };

  }

  async markSurveySeen(personId: string, surveyId: string): Promise<void> {
    // This method is called when a person first accesses the survey
    const access = await this.surveyAccessService.findByJwtToken(personId); // personId is actually the JWT token
    if (!access) {
      throw new NotFoundException('Survey access not found');
    }

    if (access.surveyId !== surveyId) {
      throw new UnauthorizedException('Invalid survey access');
    }

    await this.surveyAccessService.markAsSeen(access.jwtToken);
    this.logger.log(`Survey marked as seen for person ${access.personId}`);
  }

  async getSurveyWithQuestions(jwt: string): Promise<SurveyWithQuestionsDto> {
    const access = await this.surveyAccessService.findByJwtToken(jwt);
    if (!access) {
      throw new NotFoundException('Invalid survey access token');
    }

    const survey = access.survey;
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    // Check if survey has expired
    if (new Date() > survey.expiresAt) {
      throw new UnauthorizedException('Survey has expired');
    }

    // Mark as seen on first access
    if (!access.seen) {
      await this.surveyAccessService.markAsSeen(jwt);
    }

    return {
      surveyId: survey.id,
      questionnaire: {
        id: survey.questionnaire.id,
        title: survey.questionnaire.title,
        description: survey.questionnaire.description,
        questions: survey.questionnaire.questions.map(q => ({
          id: q.id,
          description: q.description,
          type: q.type,
          options: q.options,
        })),
      },
    };
  }

  async getSurveyById(id: string): Promise<Survey> {
    const survey = await this.surveyDBService.getSurveyById(id);
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }
    return survey;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireSurveys(): Promise<void> {
    this.logger.log('Running survey expiration check...');

    // Find all surveys that have expired but haven't been analyzed yet
    // Note: This would require adding a query method to the SurveyDBService
    // For now, we'll implement a basic version

    // Get all surveys that have expired
    const expiredSurveys = await this.getExpiredSurveys();

    for (const survey of expiredSurveys) {
      if (!survey.analyzed) {
        // Mark as analyzed
        await this.surveyDBService.markAnalyzed(survey.id);

        // Enqueue analysis job
        await this.analysisQueue.add('analyze-survey', {
          surveyId: survey.id,
          questionnaireId: survey.questionnaireId,
          populationId: survey.populationId,
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
        });

        this.logger.log(`Enqueued analysis job for expired survey: ${survey.id}`);
      }
    }
  }

  async get(userId: string): Promise<Survey[]> {
    return this.surveyDBService.getAll(userId);
  }
  private generateSurveyJWT(surveyId: string, personId: string): string {
    const payload = {
      surveyId,
      personId,
      type: 'survey-access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '30d', // Survey links expire in 30 days
    });
  }

  private async getExpiredSurveys(): Promise<any[]> {
    // This is a simplified version - in a real implementation,
    // you'd want to add a proper query method to the SurveyDBService
    const allSurveys = await this.surveyDBService.getAllSurveys();
    const now = new Date();

    return allSurveys.filter(survey =>
      new Date(survey.expiresAt) < now && !survey.analyzed
    );
  }

  async getSurveyStats(surveyId: string): Promise<{
    total: number;
    seen: number;
    completed: number;
  }> {
    // First check if the survey exists
    const survey = await this.surveyDBService.getSurveyById(surveyId);
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return this.surveyAccessService.getAccessStats(surveyId);
  }

  async getSurveyJobStatus(surveyId: string): Promise<{
    sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';
    sendJobId?: string;
    sendProgress: number;
    sendJobStartedAt?: Date;
    sendJobCompletedAt?: Date;
  }> {
    const survey = await this.surveyDBService.getSurveyById(surveyId);
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const jobStatus = await this.surveyDBService.getSurveyJobStatus(surveyId);
    if (!jobStatus) {
      throw new NotFoundException('Survey job status not found');
    }

    return jobStatus;
  }

  async submitAnswers(jwt: string, answers: { [questionId: string]: string[] }): Promise<void> {
    const access = await this.surveyAccessService.findByJwtToken(jwt);
    if (!access) {
      throw new NotFoundException('Invalid survey access token');
    }

    const survey = access.survey;
    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    // Check if survey has expired
    if (new Date() > survey.expiresAt) {
      throw new UnauthorizedException('Survey has expired');
    }

    // Submit answers
    await this.answerService.submitAnswers({
      surveyId: survey.id,
      personId: access.personId,
      answers,
    });

    // Mark as completed
    await this.surveyAccessService.markAsCompleted(jwt);

    this.logger.log(`Answers submitted for person ${access.personId} in survey ${survey.id}`);
  }


  async getAnswer(userId: string, surveyId: string, page: number = 1, limit: number = 100): Promise<Answer[]> {
    return this.answerService.getAnswersBySurvey(surveyId, page, limit);
  }

  async getAnswersStream(surveyId: string) {
    return this.answerService.getAnswersByStreaming(surveyId);
  }
} 