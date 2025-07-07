import { Test, TestingModule } from '@nestjs/testing';
import { PromptProcessor } from './prompt.processor';
import { QuestionnaireService } from '../questionnaire.service';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';

global.fetch = jest.fn();

const mockQuestionnaireService = {
  addQuestions: jest.fn(),
  changeStatusToCompleted: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};

describe('PromptProcessor', () => {
  let processor: PromptProcessor;
  let job: Partial<Job<any>>;

  beforeEach(async () => {
    (global.fetch as jest.Mock).mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptProcessor,
        { provide: QuestionnaireService, useValue: mockQuestionnaireService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    processor = module.get(PromptProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process a job and call QuestionnaireService methods', async () => {
    const id = 'test-uuid';
    const prompt = 'Test product';
    const questions = [
      { description: 'Q1', type: 'text' },
      { description: 'Q2', type: 'number' },
    ];
    (processor as any).generateSurveyQuestions = jest.fn().mockResolvedValue(questions);
    job = { data: { id, prompt } };
    await processor.handleTranscode(job as Job);
    expect(processor.generateSurveyQuestions).toHaveBeenCalledWith(prompt);
    expect(mockQuestionnaireService.addQuestions).toHaveBeenCalledWith(id, questions);
    expect(mockQuestionnaireService.changeStatusToCompleted).toHaveBeenCalledWith(id);
  });

  it('should parse OpenAI response JSON directly', async () => {
    mockConfigService.get.mockReturnValue('test');
    const fakeResponse = {
      choices: [
        { message: { content: JSON.stringify([{ description: 'Q1', type: 'text' }]) } },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });
    const result = await processor.generateSurveyQuestions('prompt');
    expect(result).toEqual([{ description: 'Q1', type: 'text' }]);
  });

  it('should parse OpenAI response with fallback extraction', async () => {
    mockConfigService.get.mockReturnValue('test');
    const fakeResponse = {
      choices: [
        { message: { content: 'Some text before [ { "description": "Q1", "type": "text" } ] some after' } },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });
    const result = await processor.generateSurveyQuestions('prompt');
    expect(result).toEqual([{ description: 'Q1', type: 'text' }]);
  });

  it('should throw if OpenAI response cannot be parsed', async () => {
    mockConfigService.get.mockReturnValue('test');
    const fakeResponse = {
      choices: [
        { message: { content: 'Not a JSON' } },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });
    await expect(processor.generateSurveyQuestions('prompt')).rejects.toThrow();
  });
}); 