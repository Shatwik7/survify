import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireDBService } from '../services/questionnaire.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Questionnaire } from '../entities/questionnaire.entity';
import { User } from '../entities/user.entity';
import { Question } from '../entities/question.entity';
import { Repository } from 'typeorm';

describe('QuestionnaireDBService', () => {
  let service: QuestionnaireDBService;
  let questionnaireRepo: jest.Mocked<Repository<Questionnaire>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let questionRepo: jest.Mocked<Repository<Question>>;

  const baseUser: User = { id: 'user-uuid' } as User;
  const baseQuestionnaire: Questionnaire = { id: 'q-uuid', user: baseUser, userId: 'user-uuid', questions: [], title: '', description: '', status: 'draft', createdAt: new Date(), updatedAt: new Date() } as Questionnaire;
  const baseQuestion: Question = { id: 'question-uuid', description: '', type: 'text', questionnaire: baseQuestionnaire } as Question;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnaireDBService,
        { provide: getRepositoryToken(Questionnaire), useValue: {
          findOne: jest.fn(),
          find: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          delete: jest.fn(),
        }},
        { provide: getRepositoryToken(User), useValue: {
          findOne: jest.fn(),
        }},
        { provide: getRepositoryToken(Question), useValue: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          remove: jest.fn(),
        }},
      ],
    }).compile();
    service = module.get(QuestionnaireDBService);
    questionnaireRepo = module.get(getRepositoryToken(Questionnaire));
    userRepo = module.get(getRepositoryToken(User));
    questionRepo = module.get(getRepositoryToken(Question));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find by id', async () => {
    questionnaireRepo.findOne.mockResolvedValue(baseQuestionnaire);
    const result = await service.findById('q-uuid');
    expect(result).toBe(baseQuestionnaire);
  });

  it('should find all for user', async () => {
    questionnaireRepo.find.mockResolvedValue([baseQuestionnaire]);
    const result = await service.findAll('user-uuid');
    expect(result).toEqual([baseQuestionnaire]);
  });

  it('should add questionnaire', async () => {
    userRepo.findOne.mockResolvedValue(baseUser);
    questionnaireRepo.create.mockReturnValue(baseQuestionnaire);
    questionnaireRepo.save.mockResolvedValue(baseQuestionnaire);
    const result = await service.addQuestionnaire('t', 'd', 'draft', 'user-uuid');
    expect(result).toBe(baseQuestionnaire);
  });

  it('should throw if user not found when adding questionnaire', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.addQuestionnaire('t', 'd', 'draft', 'user-uuid')).rejects.toThrow();
  });

  it('should update questionnaire', async () => {
    questionnaireRepo.findOne.mockResolvedValue(baseQuestionnaire);
    questionnaireRepo.save.mockResolvedValue(baseQuestionnaire);
    const result = await service.update('q-uuid', { title: 'new' });
    expect(result).toBe(baseQuestionnaire);
  });

  it('should return null if questionnaire not found for update', async () => {
    questionnaireRepo.findOne.mockResolvedValue(null);
    const result = await service.update('q-uuid', { title: 'new' });
    expect(result).toBeNull();
  });

  it('should create questionnaire with questions', async () => {
    questionnaireRepo.create.mockReturnValue(baseQuestionnaire);
    questionnaireRepo.save.mockResolvedValue(baseQuestionnaire);
    const result = await service.create('t', 'd', 'draft', [baseQuestion]);
    expect(result).toBe(baseQuestionnaire);
  });

  it('should add question to questionnaire', async () => {
    questionnaireRepo.findOne.mockResolvedValue(baseQuestionnaire);
    questionRepo.create.mockReturnValue(baseQuestion);
    questionRepo.save.mockResolvedValue(baseQuestion);
    jest.spyOn(service, 'findById').mockResolvedValue(baseQuestionnaire);
    const result = await service.addQuestionToQuestionnaire('q-uuid', { description: '', type: 'text' });
    expect(result).toBe(baseQuestionnaire);
  });

  it('should return null if questionnaire not found for addQuestionToQuestionnaire', async () => {
    questionnaireRepo.findOne.mockResolvedValue(null);
    const result = await service.addQuestionToQuestionnaire('q-uuid', { description: '', type: 'text' });
    expect(result).toBeNull();
  });

  it('should update question in questionnaire', async () => {
    questionRepo.findOne.mockResolvedValue(baseQuestion);
    questionRepo.save.mockResolvedValue(baseQuestion);
    jest.spyOn(service, 'findById').mockResolvedValue(baseQuestionnaire);
    const result = await service.updateQuestionInQuestionnaire('q-uuid', 'question-uuid', { description: 'new' });
    expect(result).toBe(baseQuestionnaire);
  });

  it('should return null if question not found for updateQuestionInQuestionnaire', async () => {
    questionRepo.findOne.mockResolvedValue(null);
    const result = await service.updateQuestionInQuestionnaire('q-uuid', 'question-uuid', { description: 'new' });
    expect(result).toBeNull();
  });

  it('should add multiple questions to questionnaire', async () => {
    questionnaireRepo.findOne.mockResolvedValue(baseQuestionnaire);
    questionRepo.create.mockReturnValue([baseQuestion] as any);
    questionRepo.save.mockResolvedValue([baseQuestion] as any);
    jest.spyOn(service, 'findById').mockResolvedValue(baseQuestionnaire);
    const result = await service.addMultipleQuestionsToQuestionnaire('q-uuid', [{ description: '', type: 'text' }]);
    expect(result).toBe(baseQuestionnaire);
  });

  it('should return null if questionnaire not found for addMultipleQuestionsToQuestionnaire', async () => {
    questionnaireRepo.findOne.mockResolvedValue(null);
    const result = await service.addMultipleQuestionsToQuestionnaire('q-uuid', [{ description: '', type: 'text' }]);
    expect(result).toBeNull();
  });

  it('should remove question from questionnaire', async () => {
    questionRepo.findOne.mockResolvedValue(baseQuestion);
    questionRepo.remove.mockResolvedValue(baseQuestion);
    jest.spyOn(service, 'findById').mockResolvedValue(baseQuestionnaire);
    const result = await service.removeQuestionFromQuestionnaire('q-uuid', 'question-uuid');
    expect(result).toBe(baseQuestionnaire);
  });

  it('should return null if question not found for removeQuestionFromQuestionnaire', async () => {
    questionRepo.findOne.mockResolvedValue(null);
    const result = await service.removeQuestionFromQuestionnaire('q-uuid', 'question-uuid');
    expect(result).toBeNull();
  });

  it('should delete questionnaire', async () => {
    questionnaireRepo.delete.mockResolvedValue({ affected: 1 } as any);
    const result = await service.delete('q-uuid');
    expect(result).toBe(true);
  });

  it('should return false if delete not affected', async () => {
    questionnaireRepo.delete.mockResolvedValue({ affected: 0 } as any);
    const result = await service.delete('q-uuid');
    expect(result).toBe(false);
  });

  it('should find by ids', async () => {
    questionnaireRepo.find.mockResolvedValue([baseQuestionnaire]);
    const result = await service.findByIds(['q-uuid']);
    expect(result).toEqual([baseQuestionnaire]);
  });
}); 