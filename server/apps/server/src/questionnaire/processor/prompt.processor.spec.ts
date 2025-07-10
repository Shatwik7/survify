import { Test, TestingModule } from '@nestjs/testing';
import { PromptProcessor } from './prompt.processor';
import { QuestionnaireService } from '../questionnaire.service';
import { QuestionnaireDBService } from '@app/database';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';

global.fetch = jest.fn();

const mockQuestionnaireService = {
  changeStatusToCompleted: jest.fn(),
};

const mockQuestionnaireRepo = {
  addMultipleQuestionsToQuestionnaire: jest.fn(),
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
        { provide: QuestionnaireDBService, useValue: mockQuestionnaireRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get(PromptProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process a job and call QuestionnaireRepo and Service methods', async () => {
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
    expect(mockQuestionnaireRepo.addMultipleQuestionsToQuestionnaire).toHaveBeenCalledWith(id, questions);
    expect(mockQuestionnaireService.changeStatusToCompleted).toHaveBeenCalledWith(id);
  });

  it('should parse OpenAI response as direct JSON array', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      return {
        AZURE_OPENAI_API_KEY: 'test-key',
        AZURE_OPENAI_ENDPOINT: 'https://example.com',
        AZURE_OPENAI_API_VERSION: '2023-05-15',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deploy',
      }[key];
    });

    const fakeResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([{ description: 'Q1', type: 'text' }]),
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });

    const result = await processor.generateSurveyQuestions('prompt');
    expect(result).toEqual([{ description: 'Q1', type: 'text' }]);
  });

  it('should fallback parse OpenAI response if content is not JSON directly', async () => {
    mockConfigService.get.mockReturnValue('test');

    const fakeResponse = {
      choices: [
        {
          message: {
            content: 'Random text [ { "description": "Q1", "type": "text" } ] more text',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });

    const result = await processor.generateSurveyQuestions('prompt');
    expect(result).toEqual([{ description: 'Q1', type: 'text' }]);
  });

  it('should throw an error if OpenAI response cannot be parsed', async () => {
    mockConfigService.get.mockReturnValue('test');

    const fakeResponse = {
      choices: [
        {
          message: {
            content: 'Non JSON content that cannot be parsed',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => fakeResponse });

    await expect(processor.generateSurveyQuestions('prompt')).rejects.toThrow(
      'Failed to parse questions from OpenAI response',
    );
  });
});
