import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireService } from './questionnaire.service';
import { JwtService } from '@nestjs/jwt';
import { QuestionnaireDBService } from '@app/database';
import { getQueueToken } from '@nestjs/bull';

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
    delete:jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    module= await Test.createTestingModule({
      providers: [
        QuestionnaireService,
        { provide: QuestionnaireDBService, useValue: mockQuestionnaireDBService },
        { provide: JwtService, useValue: mockJwtService },

        { provide: getQueueToken('openai-questionnare-generator'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<QuestionnaireService>(QuestionnaireService);
  });
   afterAll(async () => {
    await module.close(); // ⛔ prevents lingering async resources
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
    const mockQ = { id: 'q1', title: 'Quiz 1' };
    mockQuestionnaireDBService.findById.mockResolvedValue(mockQ);

    const result = await service.findOne('q1');
    expect(result).toEqual(mockQ);
    expect(mockQuestionnaireDBService.findById).toHaveBeenCalledWith('q1');
  });

  it('should find many questionnaires by ids', async () => {
    const mockQs = [{ id: 'q1' }, { id: 'q2' }];
    mockQuestionnaireDBService.findByIds.mockResolvedValue(mockQs);

    const result = await service.findMany(['q1', 'q2']);
    expect(result).toEqual(mockQs);
    expect(mockQuestionnaireDBService.findByIds).toHaveBeenCalledWith(['q1', 'q2']);
  });

  it('should add a question to questionnaire', async () => {
    const dto = { text: 'Question text', type: 'MCQ' };
    const mockResponse = { success: true };
    mockQuestionnaireDBService.addQuestionToQuestionnaire.mockResolvedValue(mockResponse);

    const result = await service.addQuestion('q1', dto as any);
    expect(result).toEqual(mockResponse);
    expect(mockQuestionnaireDBService.addQuestionToQuestionnaire).toHaveBeenCalledWith('q1', dto);
  });

  it('should add multiple questions to questionnaire', async () => {
    const questions = [
      { text: 'Q1', type: 'MCQ' },
      { text: 'Q2', type: 'Short' },
    ];
    const mockResponse = { success: true };
    mockQuestionnaireDBService.addMultipleQuestionsToQuestionnaire.mockResolvedValue(mockResponse);

    const result = await service.addQuestions('q1', questions as any);
    expect(result).toEqual(mockResponse);
    expect(mockQuestionnaireDBService.addMultipleQuestionsToQuestionnaire).toHaveBeenCalledWith('q1', questions);
  });

  it('should throw NotFoundException if questionnaire not found in findOne', async () => {
    mockQuestionnaireDBService.findById.mockResolvedValue(null);
    await expect(service.findOne('notfound')).rejects.toThrow('Questionnaire with ID notfound not found');
  });

  it('should throw NotFoundException if no questionnaires found in findMany', async () => {
    mockQuestionnaireDBService.findByIds.mockResolvedValue([]);
    await expect(service.findMany(['id1', 'id2'])).rejects.toThrow('No questionnaires found for given IDs');
  });

  it('should throw BadRequestException if addQuestion fails', async () => {
    mockQuestionnaireDBService.addQuestionToQuestionnaire.mockResolvedValue(null);
    await expect(service.addQuestion('q1', { text: 'Q', type: 'MCQ' } as any)).rejects.toThrow(
      'Failed to add question to questionnaire with ID q1'
    );
  });

  it('should throw BadRequestException if addQuestions fails', async () => {
    mockQuestionnaireDBService.addMultipleQuestionsToQuestionnaire.mockResolvedValue(null);
    await expect(service.addQuestions('q1', [{ text: 'Q', type: 'MCQ' }] as any)).rejects.toThrow(
      'Failed to add questions to questionnaire with ID q1'
    );
  });

  it('should update a questionnaire', async () => {
    const dto = { title: 'Updated' };
    const mockResult = { id: 'q1', ...dto };
    mockQuestionnaireDBService.update.mockResolvedValue(mockResult);

    const result = await service.update('q1', dto as any);
    expect(result).toEqual(mockResult);
    expect(mockQuestionnaireDBService.update).toHaveBeenCalledWith('q1', dto);
  });

  it('should throw NotFoundException if update fails', async () => {
    mockQuestionnaireDBService.update.mockResolvedValue(null);
    await expect(service.update('q1', { title: 'Updated' } as any)).rejects.toThrow(
      'Questionnaire with ID q1 not found'
    );
  });

  it('should remove a questionnaire', async () => {
    mockQuestionnaireDBService.delete = jest.fn().mockResolvedValue(true);
    const result = await service.remove('q1');
    expect(result).toEqual({ success: true });
    expect(mockQuestionnaireDBService.delete).toHaveBeenCalledWith('q1');
  });

  it('should throw NotFoundException if remove fails', async () => {
    mockQuestionnaireDBService.delete = jest.fn().mockResolvedValue(false);
    await expect(service.remove('q1')).rejects.toThrow('Questionnaire with ID q1 not found');
  });

  it('should use OpenAI to create questionnaire and queue job', async () => {
    const mockQuestionnaire = { id: 'q1', title: 'AI', description: 'desc', status: 'queued' };
    mockQuestionnaireDBService.addQuestionnaire.mockResolvedValue(mockQuestionnaire);
    mockQueue.add.mockResolvedValue({ id: 'job1' });

    const result = await service.useOpenAI('user1', 'prompt', 'AI', 'desc');
    expect(result).toEqual(mockQuestionnaire);
    expect(mockQuestionnaireDBService.addQuestionnaire).toHaveBeenCalledWith('AI', 'desc', 'queued', 'user1', 'prompt');
    expect(mockQueue.add).toHaveBeenCalledWith('genrate', { prompt: 'prompt', id: 'q1' });
  });

  it('should change status to completed', async () => {
    const mockQuestionnaire = { id: 'q1', status: 'completed' };
    mockQuestionnaireDBService.update.mockResolvedValue(mockQuestionnaire);

    const result = await service.changeStatusToCompleted('q1');
    expect(result).toEqual(mockQuestionnaire);
    expect(mockQuestionnaireDBService.update).toHaveBeenCalledWith('q1', { status: 'completed' });
  });

  it('should return null if changeStatusToCompleted fails', async () => {
    mockQuestionnaireDBService.update.mockResolvedValue(null);
    const result = await service.changeStatusToCompleted('q1');
    expect(result).toBeNull();
    expect(mockQuestionnaireDBService.update).toHaveBeenCalledWith('q1', { status: 'completed' });
  });
  
});
