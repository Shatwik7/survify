import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireDBService, QuestionDBService } from '@app/database';
import { getQueueToken } from '@nestjs/bull';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';


describe('QuestionnaireService', () => {
  let service: QuestionnaireService;
  let module: TestingModule;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockQuestionnaireDBService = {
    addQuestionnaire: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    addQuestionToQuestionnaire: jest.fn(),
    addMultipleQuestionsToQuestionnaire: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateQuestionInQuestionnaire: jest.fn(),
    removeQuestionFromQuestionnaire: jest.fn(),
  };

  const mockQuestionDBService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        QuestionnaireService,
        { provide: QuestionnaireDBService, useValue: mockQuestionnaireDBService },
        { provide: QuestionDBService, useValue: mockQuestionDBService },
        { provide: getQueueToken('openai-questionnare-generator'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<QuestionnaireService>(QuestionnaireService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a questionnaire', async () => {
    const dto = { title: 'Test', description: 'desc' };
    const mockResult = { id: 'q1', ...dto, status: 'draft' };
    mockQuestionnaireDBService.addQuestionnaire.mockResolvedValue(mockResult);

    const result = await service.create(dto as any, 'user123');
    expect(result).toEqual(mockResult);
    expect(mockQuestionnaireDBService.addQuestionnaire).toHaveBeenCalledWith('Test', 'desc', 'draft', 'user123');
  });

  it('should return all questionnaires for user', async () => {
    const mockData = [{ id: 'q1' }, { id: 'q2' }];
    mockQuestionnaireDBService.findAll.mockResolvedValue(mockData);

    const result = await service.findAll('user123');
    expect(result).toEqual(mockData);
    expect(mockQuestionnaireDBService.findAll).toHaveBeenCalledWith('user123');
  });

  it('should find a questionnaire by id', async () => {
    const mockQ = { id: 'q1', title: 'Quiz 1', userId: 'user123' };
    mockQuestionnaireDBService.findById.mockResolvedValue(mockQ);

    const result = await service.findOne('q1', 'user123');
    expect(result).toEqual(mockQ);
    expect(mockQuestionnaireDBService.findById).toHaveBeenCalledWith('q1');
  });

  it('should throw UnauthorizedException if accessing another user\'s questionnaire', async () => {
    const mockQ = { id: 'q1', title: 'Quiz 1', userId: 'otherUser' };
    mockQuestionnaireDBService.findById.mockResolvedValue(mockQ);

    await expect(service.findOne('q1', 'user123')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException if questionnaire not found in findOne', async () => {
    mockQuestionnaireDBService.findById.mockResolvedValue(null);
    await expect(service.findOne('notfound', 'user123')).rejects.toThrow(NotFoundException);
  });

  it('should find many questionnaires by ids (with filtering)', async () => {
    const mockQs = [
      { id: 'q1', userId: 'user123' },
      { id: 'q2', userId: 'user456' },
    ];
    mockQuestionnaireDBService.findByIds.mockResolvedValue(mockQs);

    const result = await service.findMany(['q1', 'q2'], 'user123');
    expect(result).toEqual([{ id: 'q1', userId: 'user123' }]);
  });

  it('should throw NotFoundException if findMany returns empty', async () => {
    mockQuestionnaireDBService.findByIds.mockResolvedValue([]);
    await expect(service.findMany(['id1', 'id2'], 'user123')).rejects.toThrow(NotFoundException);
  });

  it('should add a question to questionnaire', async () => {
    const dto = { description: 'Question text', type: 'MCQ' };
    const mockQ = { id: 'q1', userId: 'user123' };
    const mockResponse = { success: true };

    mockQuestionnaireDBService.findById.mockResolvedValue(mockQ);
    mockQuestionnaireDBService.addQuestionToQuestionnaire.mockResolvedValue(mockResponse);

    const result = await service.addQuestion('user123', 'q1', dto as any);
    expect(result).toEqual(mockResponse);
  });

  it('should throw BadRequestException if addQuestion fails', async () => {
    const dto = { description: 'Q', type: 'MCQ' };
    const mockQ = { id: 'q1', userId: 'user123' };
    mockQuestionnaireDBService.findById.mockResolvedValue(mockQ);
    mockQuestionnaireDBService.addQuestionToQuestionnaire.mockResolvedValue(null);

    await expect(service.addQuestion('user123', 'q1', dto as any)).rejects.toThrow(BadRequestException);
  });

  it('should update a question in questionnaire', async () => {
    const dto = { description: 'Updated Q' };
    const question = { id: 'qid', questionnaireId: 'q1' };
    mockQuestionDBService.findById.mockResolvedValue(question);
    mockQuestionnaireDBService.updateQuestionInQuestionnaire.mockResolvedValue({ id: 'q1' });

    const result = await service.updateQuestions('user123', 'q1', 'qid', dto);
    expect(result).toEqual({ id: 'q1' });
  });

  it('should remove a question from questionnaire', async () => {
    const question = { id: 'qid', questionnaireId: 'q1' };
    mockQuestionDBService.findById.mockResolvedValue(question);
    mockQuestionnaireDBService.removeQuestionFromQuestionnaire.mockResolvedValue({ id: 'q1' });

    const result = await service.removeQuestion('user123', 'q1', 'qid');
    expect(result).toEqual({ id: 'q1' });
  });
});
