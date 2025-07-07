import { Test, TestingModule } from '@nestjs/testing';
import { PopulationUploadProcessor } from './population-upload.processor';
import { PersonDBService, PopulationDBService } from '@app/database';
import { FileStorageService } from '@app/file-storage';
import { Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';

const mockPersonDBService = {
  addPersonsToPopulationWithIgnoreError: jest.fn(),
};
const mockFileStorageService = {
  getStream: jest.fn(),
  delete: jest.fn(),
};
const mockPopulationDBService = {
  updatePopulationStatus: jest.fn(),
};

describe('PopulationUploadProcessor', () => {
  let processor: PopulationUploadProcessor;
  let job: Partial<Job<any>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PopulationUploadProcessor,
        { provide: PersonDBService, useValue: mockPersonDBService },
        { provide: FileStorageService, useValue: mockFileStorageService },
        { provide: PopulationDBService, useValue: mockPopulationDBService },
      ],
    }).compile();
    processor = module.get(PopulationUploadProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should handle upload and process rows', async () => {
    const populationId = uuidv4();
    const userId = uuidv4();
    const population = { id: populationId, name: 'TestPop', userId };
    const filePath = '/tmp/test.xlsx';
    const totalRows = 2;
    const mockRows = [
      { number: 1, values: [null, 'email', 'name', 'phone'], },
      { number: 2, values: [null, 'a@b.com', 'Alice', '123'], },
      { number: 3, values: [null, 'b@c.com', 'Bob', '456'], },
    ];
    const worksheet = {
      [Symbol.asyncIterator]: function* () { for (const row of mockRows) yield row; },
    };
    const workbookReader = {
      [Symbol.asyncIterator]: function* () { yield worksheet; },
    };
    mockFileStorageService.getStream.mockResolvedValue({});
    jest.spyOn(require('exceljs').stream.xlsx, 'WorkbookReader').mockImplementation(() => workbookReader);
    job = {
      data: { filePath, population, lastRow: 0, total: totalRows },
      update: jest.fn(),
      progress: jest.fn(),
    };
    await processor.handleUpload(job as Job<any>);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(populationId, 'working');
    expect(mockPersonDBService.addPersonsToPopulationWithIgnoreError).toHaveBeenCalled();
    expect(job.progress).toHaveBeenCalledWith(100);
  });

  it('should handle completed', async () => {
    const populationId = uuidv4();
    const jobData = { filePath: '/tmp/test.xlsx', population: { id: populationId }, };
    job = { id: 1, data: jobData, getState: jest.fn().mockResolvedValue('completed') };
    await processor.completed(job as Job<any>);
    expect(mockFileStorageService.delete).toHaveBeenCalledWith(jobData.filePath);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(populationId, 'completed');
  });

  it('should handle failed', async () => {
    const populationId = uuidv4();
    const jobData = { filePath: '/tmp/test.xlsx', population: { id: populationId }, };
    job = { id: 2, data: jobData, getState: jest.fn().mockResolvedValue('failed') };
    await processor.failed(job as Job<any>);
    expect(mockFileStorageService.delete).toHaveBeenCalledWith(jobData.filePath);
    expect(mockPopulationDBService.updatePopulationStatus).toHaveBeenCalledWith(populationId, 'failed');
  });
}); 