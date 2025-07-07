import { Test, TestingModule } from '@nestjs/testing';
import { AnswerService } from '../services/answer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Answer } from '../entities/answer.entity';
import { Repository } from 'typeorm';

const mockAnswerRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

describe('AnswerService', () => {
  let service: AnswerService;
  let repo: typeof mockAnswerRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerService,
        { provide: getRepositoryToken(Answer), useValue: mockAnswerRepo },
      ],
    }).compile();
    service = module.get(AnswerService);
    repo = module.get(getRepositoryToken(Answer));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should submit answers', async () => {
    const data = {
      surveyId: 'survey-uuid',
      personId: 'person-uuid',
      answers: {
        'q1': ['a'],
        'q2': ['b', 'c'],
      },
    };
    const createdEntities = [{}, {}];
    repo.create.mockImplementation(() => ({}));
    repo.save.mockResolvedValue(createdEntities);
    await service.submitAnswers(data);
    expect(repo.create).toHaveBeenCalledTimes(2);
    expect(repo.save).toHaveBeenCalledWith([{}, {}]);
  });

  it('should get answers by survey', async () => {
    const answers = [{ id: 1 }, { id: 2 }];
    repo.find.mockResolvedValue(answers);
    const result = await service.getAnswersBySurvey('survey-uuid', 2, 10);
    expect(repo.find).toHaveBeenCalledWith({
      where: { survey: { id: 'survey-uuid' } },
      skip: 10,
      take: 10,
    });
    expect(result).toBe(answers);
  });
}); 