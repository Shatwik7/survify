import { Test, TestingModule } from '@nestjs/testing';
import { SurveyService } from '../services/survey.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from '../entities/survey.entity';
import { Repository, LessThan } from 'typeorm';
import { Questionnaire } from '../entities/questionnaire.entity';
import { Population } from '../entities/population.entity';
import { User } from '../entities/user.entity';

describe('SurveyService', () => {
  let service: SurveyService;
  let repo: jest.Mocked<Repository<Survey>>;

  const baseSurvey: Survey = {
    id: '1',
    questionnaire: { id: 'q-uuid' } as Questionnaire,
    questionnaireId: 'q-uuid',
    population: { id: 'p-uuid' } as Population,
    populationId: 'p-uuid',
    user: { id: 'u-uuid' } as User,
    userId: 'u-uuid',
    deliveryModes: ['email'],
    expiresAt: new Date(),
    analyzed: false,
    sendJobStatus: 'NotStarted',
    sendProgress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        { provide: getRepositoryToken(Survey), useValue: {
          find: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          update: jest.fn(),
          findOne: jest.fn(),
        }},
      ],
    }).compile();
    service = module.get(SurveyService);
    repo = module.get(getRepositoryToken(Survey));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all surveys for a user', async () => {
    const surveys = [baseSurvey];
    repo.find.mockResolvedValue(surveys);
    const result = await service.getAll('user-uuid');
    expect(repo.find).toHaveBeenCalledWith({ where: { user: { id: 'user-uuid' } } });
    expect(result).toBe(surveys);
  });

  it('should create a survey', async () => {
    const data = {
      questionnaireId: 'q-uuid',
      populationId: 'p-uuid',
      userId: 'u-uuid',
      deliveryModes: ['email' as const],
      expiresAt: new Date(),
    };
    const survey = { ...baseSurvey, ...data };
    repo.create.mockReturnValue(survey);
    repo.save.mockResolvedValue(survey);
    const result = await service.createSurvey(data);
    expect(repo.create).toHaveBeenCalledWith({
      questionnaire: { id: data.questionnaireId },
      population: { id: data.populationId },
      user: { id: data.userId },
      deliveryModes: data.deliveryModes,
      expiresAt: data.expiresAt,
    });
    expect(repo.save).toHaveBeenCalledWith(survey);
    expect(result).toBe(survey);
  });

  it('should mark a survey as analyzed', async () => {
    repo.update.mockResolvedValue({} as any);
    await service.markAnalyzed('survey-uuid');
    expect(repo.update).toHaveBeenCalledWith({ id: 'survey-uuid' }, { analyzed: true });
  });

  it('should get survey by id', async () => {
    const survey = { ...baseSurvey, id: 'survey-uuid' };
    repo.findOne.mockResolvedValue(survey as any);
    const result = await service.getSurveyById('survey-uuid');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'survey-uuid' }, relations: ['questionnaire', 'population'] });
    expect(result).toBe(survey);
  });

  it('should get all surveys', async () => {
    const surveys = [baseSurvey];
    repo.find.mockResolvedValue(surveys);
    const result = await service.getAllSurveys();
    expect(repo.find).toHaveBeenCalledWith({ relations: ['questionnaire', 'population'] });
    expect(result).toBe(surveys);
  });

  it('should get expired surveys', async () => {
    const surveys = [baseSurvey];
    repo.find.mockResolvedValue(surveys);
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now as any);
    const result = await service.getExpiredSurveys();
    expect(repo.find).toHaveBeenCalledWith({
      where: {
        expiresAt: LessThan(now),
        analyzed: false,
      },
      relations: ['questionnaire', 'population'],
    });
    expect(result).toBe(surveys);
  });

  it('should update send job status', async () => {
    repo.update.mockResolvedValue({} as any);
    await service.updateSendJobStatus('survey-uuid', 'Processing', 'job-123', 50);
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'survey-uuid' },
      expect.objectContaining({
        sendJobStatus: 'Processing',
        sendJobId: 'job-123',
        sendProgress: 50,
      })
    );
  });

  // it('should update send job status with start time when no job ID', async () => {
  //   repo.update.mockResolvedValue({} as any);
  //   await service.updateSendJobStatus('survey-uuid', 'Processing', undefined, 50);
  //   expect(repo.update).toHaveBeenCalledWith(
  //     { id: 'survey-uuid' },
  //     {
  //       sendJobStatus: 'Processing',
  //       sendProgress: 50,
  //       sendJobStartedAt: expect.any(Date),
  //     }
  //   );
  // });

  it('should get survey job status', async () => {
    const mockDate = new Date('2023-01-01T00:00:00Z');
    const surveyWithJobStatus = {
      ...baseSurvey,
      sendJobStatus: 'Processing' as const,
      sendJobId: 'job-123',
      sendProgress: 75,
      sendJobStartedAt: mockDate,
      sendJobCompletedAt: null,
    };
    repo.findOne.mockResolvedValue(surveyWithJobStatus as any);
    const result = await service.getSurveyJobStatus('survey-uuid');
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'survey-uuid' },
      select: ['sendJobStatus', 'sendJobId', 'sendProgress', 'sendJobStartedAt', 'sendJobCompletedAt']
    });
    expect(result).toEqual({
      sendJobStatus: 'Processing',
      sendJobId: 'job-123',
      sendProgress: 75,
      sendJobStartedAt: mockDate,
      sendJobCompletedAt: null,
    });
  });
}); 