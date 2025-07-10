import { Test, TestingModule } from '@nestjs/testing';
import { PopulationController } from './population.controller';
import { PopulationService } from './population.service';
import { FileStorageService } from '@app/file-storage';
import { Queue } from 'bullmq';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Population, Person } from '@app/database';
import { FilterGroup } from './dto/filter.types';
import { UUID } from 'crypto';
import { UpdatePersonDto } from './dto/update-person.dto';

describe('PopulationController', () => {
  let controller: PopulationController;
  let populationService: jest.Mocked<PopulationService>;
  let fileStorageService: jest.Mocked<FileStorageService>;
  let queue: jest.Mocked<Queue>;

  const mockPopulation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Population',
    userId: '123e4567-e89b-12d3-a456-426614174000', // valid UUID
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
    jobId: null,
    parentPopulation: null,
    parentPopulationId: null,
    user: null,
    children: [],
    persons: [],
  } as unknown as Population;

  const mockPerson = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    name: 'Test Person',
    phone: '1234567890',
    customFields: { department: 'Engineering' },
    createdAt: new Date(),
    updatedAt: new Date(),
    populations: [],
  } as unknown as Person;

  const mockJob = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    data: { userId: '123e4567-e89b-12d3-a456-426614174000' },
    getStatus: jest.fn().mockReturnValue('completed'),
    progress: 100,
  };

  beforeEach(async () => {
    const mockPopulationService = {
      getPopulations: jest.fn(),
      getPoplation: jest.fn(),
      getPopulationWithPersons: jest.fn(),
      createPopulation: jest.fn(),
      createSegmentationAsync: jest.fn(),
      deletePopulation: jest.fn(),
      deletePersonFromPopulation: jest.fn(),
      updatePersonFromPopulation: jest.fn(),
      uploadPopulationAsync: jest.fn(),
      filterPopulation: jest.fn(),
      createPersonAndAddToPopulation: jest.fn(),
    };

    const mockFileStorageService = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PopulationController],
      providers: [
        {
          provide: PopulationService,
          useValue: mockPopulationService,
        },
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
        {
          provide: 'BullQueue_population',
          useValue: mockQueue,
        },
      ],
    }).compile();

    controller = module.get<PopulationController>(PopulationController);
    populationService = module.get(PopulationService);
    fileStorageService = module.get(FileStorageService);
    queue = module.get('BullQueue_population');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPopulations', () => {
    it('should return populations for user', async () => {
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};
      const page = 1;
      const limit = 10;
      const expectedPopulations = [mockPopulation];

      populationService.getPopulations.mockResolvedValue(expectedPopulations);

      const result = await controller.getPopulations(req, page, limit);

      expect(result).toEqual(expectedPopulations);
      expect(populationService.getPopulations).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', page, limit);
    });

    it('should return populations without pagination', async () => {
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};
      const expectedPopulations = [mockPopulation];

      populationService.getPopulations.mockResolvedValue(expectedPopulations);

      const result = await controller.getPopulations(req,undefined,undefined);

      expect(result).toEqual(expectedPopulations);
      expect(populationService.getPopulations).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', undefined, undefined);
    });
  });

  describe('getPopulation', () => {
    it('should return population when found and user has access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};

      populationService.getPoplation.mockResolvedValue(mockPopulation);

      const result = await controller.getPopulation(populationId, req);

      expect(result).toEqual(mockPopulation);
      expect(populationService.getPoplation).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when population does not exist', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};

      populationService.getPoplation.mockRejectedValue(new NotFoundException('Population Does Not Exists'));

      await expect(controller.getPopulation(populationId, req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPopulationWithPerson', () => {
    it('should return population with persons when found and user has access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};
      const page = 1;
      const limit = 50;
      const expectedResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationService.getPopulationWithPersons.mockResolvedValue(expectedResponse);

      const result = await controller.getPopulationWithPerson(populationId, page, limit, req);

      expect(result).toEqual(expectedResponse);
      expect(populationService.getPopulationWithPersons).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000', page, limit);
    });

    it('should use default pagination values', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};
      const expectedResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationService.getPopulationWithPersons.mockResolvedValue(expectedResponse);

      const result = await controller.getPopulationWithPerson(populationId, undefined, undefined, req);

      expect(result).toEqual(expectedResponse);
      expect(populationService.getPopulationWithPersons).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000', 1, 50);
    });
  });

  describe('removeJob', () => {
    it('should remove job successfully', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};

      queue.getJob.mockResolvedValue(mockJob);
      queue.remove.mockResolvedValue(1);

      const result = await controller.removeJob(jobId, req);

      expect(result).toBe(1);
      expect(queue.getJob).toHaveBeenCalledWith(jobId);
      expect(queue.remove).toHaveBeenCalledWith(jobId);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      const jobId = 'job-123';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };

      queue.getJob.mockResolvedValue(null);

      await expect(controller.removeJob(jobId, req)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access to job', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174002' } } as {user:{id:UUID}};

      queue.getJob.mockResolvedValue(mockJob);

      await expect(controller.removeJob(jobId, req)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException when job is active', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } } as {user:{id:UUID}};
      const activeJob = { ...mockJob, getStatus: jest.fn().mockReturnValue('active') };

      queue.getJob.mockResolvedValue(activeJob);

      await expect(controller.removeJob(jobId, req)).rejects.toThrow(ConflictException);
    });
  });

  describe('getStatus', () => {
    it('should return job status successfully', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};

      queue.getJob.mockResolvedValue(mockJob);

      const result = await controller.getStatus(jobId, req);

      expect(result).toEqual(mockJob);
      expect(queue.getJob).toHaveBeenCalledWith(jobId);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}}

      queue.getJob.mockResolvedValue(null);

      await expect(controller.getStatus(jobId, req)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access to job', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174002' } };

      queue.getJob.mockResolvedValue(mockJob);

      await expect(controller.getStatus(jobId, req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createPopulation', () => {
    it('should create population successfully', async () => {
      const body = { name: 'New Population' };
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};

      populationService.createPopulation.mockResolvedValue(mockPopulation);

      const result = await controller.createPopulation(body, req);

      expect(result).toEqual(mockPopulation);
      expect(populationService.createPopulation).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'New Population', undefined, undefined, 'completed');
    });

    it('should throw BadRequestException when name is missing', async () => {
      const body = {} as any; // bypass TS, simulate missing name
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};
      await expect(controller.createPopulation(body, req)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      const body = { name: 'New Population' };
      const req = { user: {} }as {user:{id:UUID}};

      await expect(controller.createPopulation(body, req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSegmentationAsync', () => {
    it('should create segmentation successfully', async () => {
      const body = {
        parentPopulationId: '123e4567-e89b-12d3-a456-426614174000',
        segmentName: 'New Segment',
        filter: {
          logic: 'AND' as const,
          conditions: [],
        },
      };
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};

      populationService.createSegmentationAsync.mockResolvedValue(mockPopulation);

      const result = await controller.createSegmentationAsync(body, req);

      expect(result).toEqual(mockPopulation);
      expect(populationService.createSegmentationAsync).toHaveBeenCalledWith(
        'New Segment',
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174000',
        body.filter
      );
    });
  });

  describe('deletePopualtion', () => {
    it('should delete population successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};

      populationService.deletePopulation.mockResolvedValue(true);

      const result = await controller.deletePopualtion(populationId, req);

      expect(result).toBe(true);
      expect(populationService.deletePopulation).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('deletePersonFromPopulation', () => {
    it('should delete person from population successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } }as {user:{id:UUID}};

      populationService.deletePersonFromPopulation.mockResolvedValue(undefined);

      const result = await controller.deletePersonFromPopulation(populationId, personId, req);

      expect(result).toBeUndefined();
      expect(populationService.deletePersonFromPopulation).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000', personId);
    });
  });

  describe('UpdatePerson', () => {
    it('should update person successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';
      const personUpdate = { name: 'Updated Name' } as UpdatePersonDto ;
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };

      populationService.updatePersonFromPopulation.mockResolvedValue(true);

      const result = await controller.UpdatePerson(populationId, personId, personUpdate, req);

      expect(result).toBe(true);
      expect(populationService.updatePersonFromPopulation).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000', personId, personUpdate);
    });
  });

  describe('createPopulationAsync', () => {
    it('should upload population file successfully', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };

      fileStorageService.upload.mockResolvedValue('/path/to/file.csv');
      populationService.uploadPopulationAsync.mockResolvedValue(mockPopulation);

      const result = await controller.createPopulationAsync(file, populationId, req);

      expect(result).toEqual(mockPopulation);
      expect(fileStorageService.upload).toHaveBeenCalledWith(file);
      expect(populationService.uploadPopulationAsync).toHaveBeenCalledWith(populationId, '123e4567-e89b-12d3-a456-426614174000', '/path/to/file.csv');
    });
  });

  describe('filterAndGet', () => {
    it('should filter and return persons successfully', async () => {
      const filters: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'email',
            operator: '=',
            type: 'string',
            value: 'test@example.com',
          },
        ],
      };
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const page = 1;
      const limit = 50;
      const expectedPersons = [mockPerson];

      populationService.filterPopulation.mockResolvedValue(expectedPersons);

      const result = await controller.filterAndGet(filters, req, populationId, page, limit);

      expect(result).toEqual(expectedPersons);
      expect(populationService.filterPopulation).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', populationId, filters, page, limit);
    });
  });

  describe('addPerson', () => {
    it('should add person to population successfully', async () => {
      const person = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test Person',
        customFields: { department: 'Engineering' },
      };
      const req = { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };
      const populationId = '123e4567-e89b-12d3-a456-426614174000';

      populationService.createPersonAndAddToPopulation.mockResolvedValue(mockPerson);

      const result = await controller.addPerson(person, req, populationId);

      expect(result).toEqual(mockPerson);
      expect(populationService.createPersonAndAddToPopulation).toHaveBeenCalledWith(person, '123e4567-e89b-12d3-a456-426614174000', populationId);
    });
  });
});
