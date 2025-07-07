import { Test, TestingModule } from '@nestjs/testing';
import { SegmentProcessor } from './segmentation.processor';
import { PersonDBService, PopulationDBService } from '@app/database';
import { Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { QueueSegmentDto } from '../dto/queue-segment.dto';
import { FilterGroup } from '../dto/filter.types';


const mockPersonDBService = {
  fetchPersonsFromPopulationInPages: jest.fn(),
  storePersonsInPopulationFromAnotherPopulation: jest.fn(),
};
const mockPopulationDBService = {
  updatePopulationStatus: jest.fn(),
};

describe('SegmentProcessor', () => {
  let processor: SegmentProcessor;
  let job: Partial<Job<any>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SegmentProcessor,
        { provide: PersonDBService, useValue: mockPersonDBService },
        { provide: PopulationDBService, useValue: mockPopulationDBService },
      ],
    }).compile();
    processor = module.get(SegmentProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should handle segmentation job', async () => {
    const fromPopulationId = uuidv4();
    const toPopulationId = uuidv4();
    const userId = uuidv4();
    const fromPopulation = { id: fromPopulationId };
    const toPopulation = { id: toPopulationId, name: 'Segment', userId };
    const filter:FilterGroup= {
      "logic":"AND",
      "conditions":[],
    }
    const total = 2000;
    const lastSuccessfulPage = 0;
    const mockData = [
      { id: uuidv4(), email: 'a@b.com' },
      { id: uuidv4(), email: 'b@c.com' },
    ];
    mockPersonDBService.fetchPersonsFromPopulationInPages.mockImplementationOnce(async () => ({ data: mockData, hasNextPage: false }));
    mockPersonDBService.storePersonsInPopulationFromAnotherPopulation.mockResolvedValue(undefined);
    job = {
      data: {fromPopulation, toPopulation, filter, total, lastSuccessfulPage },
      update: jest.fn(),
      progress: jest.fn(),
    };
    await processor.handle(job as Job<QueueSegmentDto>);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(toPopulationId, 'working');
    expect(mockPersonDBService.storePersonsInPopulationFromAnotherPopulation).toHaveBeenCalled();
    expect(job.progress).toHaveBeenCalledWith(100);
  });

  it('should handle completed', async () => {
    const toPopulationId = uuidv4();
    job = { id: 1, data: { toPopulation: { id: toPopulationId } }, getState: jest.fn().mockResolvedValue('completed') };
    await processor.completed(job as Job<QueueSegmentDto>);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(toPopulationId, 'completed');
  });

  it('should handle failed', async () => {
    const toPopulationId = uuidv4();
    job = { id: 2, data: { toPopulation: { id: toPopulationId } }, getState: jest.fn().mockResolvedValue('failed') };
    await processor.failed(job as Job<QueueSegmentDto>);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(toPopulationId, 'failed');
  });
}); 