import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

describe('QuestionnaireController', () => {
  let controller: QuestionnaireController;
  let service: QuestionnaireService;
  let module: TestingModule
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addQuestion: jest.fn(),
    addQuestions: jest.fn(),
    findMany: jest.fn()
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [QuestionnaireController],
      providers: [
        {
          provide: QuestionnaireService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<QuestionnaireController>(QuestionnaireController);
    service = module.get<QuestionnaireService>(QuestionnaireService);
  });
  afterAll(async () => {
    await module.close(); // ⛔ prevents lingering async resources
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user ID', async () => {
      const dto: CreateQuestionnaireDto = { title: 'Test', description: 'Desc' };
      const userId = 'user123';
      const req = { user: { id: userId } };
      const mockResult = { id: 'q123', ...dto };

      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create(req, dto);
      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('findAll', () => {
    it('should return all questionnaires for user', async () => {
      const req = { user: { id: 'user123' } };
      const mockResult = [{ id: 'q1' }, { id: 'q2' }];
      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(req);
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith('user123');
    });
  });

  describe('findOne', () => {
    it('should return a questionnaire by id', async () => {
      const mockResult = { id: 'q123', title: 'Test' };
      mockService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('q123');
      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith('q123');
    });
  });

  describe('update', () => {
    it('should update a questionnaire by id', async () => {
      const dto: UpdateQuestionnaireDto = { title: 'Updated' };
      const mockResult = { id: 'q123', title: 'Updated' };
      mockService.update.mockResolvedValue(mockResult);

      const result = await controller.update('q123', dto);
      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith('q123', dto);
    });
  });

  describe('remove', () => {
    it('should remove a questionnaire by id', async () => {
      mockService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('q123');
      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith('q123');
    });
  });

  describe('addQuestion', () => {
    it('should add a question to questionnaire', async () => {
      const dto: CreateQuestionDto = {
        description: 'Q1',
        type: 'text',
        options: [],
      };
      const mockResult = { id: 'q123', questions: [dto] };
      mockService.addQuestion.mockResolvedValue(mockResult);

      const result = await controller.addQuestion('q123', dto);
      expect(result).toEqual(mockResult);
      expect(service.addQuestion).toHaveBeenCalledWith('q123', dto);
    });
  });

  describe('addQuestions', () => {
    it('should add multiple questions to questionnaire', async () => {
      const dtos: CreateQuestionDto[] = [
        {
          description: 'Q1',
          type: 'text',
          options: [],
        },
        {
          description: 'Q2',
          type: 'number',
          options: [],
        },
      ];
      const mockResult = { _id: 'q123', questions: dtos };
      mockService.addQuestions.mockResolvedValue(mockResult);

      const result = await controller.addQuestions('q123', dtos);
      expect(result).toEqual(mockResult);
      expect(service.addQuestions).toHaveBeenCalledWith('q123', dtos);
    });
  });

  describe('findMany', () => {
    it('should find questionnaires by ids', async () => {
      const ids = ['q1', 'q2'];
      const mockResult = [{ id: 'q1' }, { id: 'q2' }];
      mockService.findMany.mockResolvedValue(mockResult);

      const result = await controller.findMany(ids.join(','));
      expect(result).toEqual(mockResult);
      expect(service.findMany).toHaveBeenCalledWith(ids);
    });
  });
});
