import { Test, TestingModule } from '@nestjs/testing';
import { PopulationService } from './population.service';
import { PopulationDBService, PersonDBService } from '@app/database';
import { FileStorageService } from '@app/file-storage';
import { Queue } from 'bullmq';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FilterGroup } from './dto/filter.types';
import { Population, Person } from '@app/database';

describe('PopulationService', () => {
  let service: PopulationService;
  let populationDBService: jest.Mocked<PopulationDBService>;
  let personDBService: jest.Mocked<PersonDBService>;
  let fileStorageService: jest.Mocked<FileStorageService>;
  let queue: jest.Mocked<Queue>;

  const mockPopulation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Population',
    userId: '123e4567-e89b-12d3-a456-426614174000',
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

  beforeEach(async () => {
    const mockPopulationDBService = {
      getPopulationsForUser: jest.fn(),
      getPopulation: jest.fn(),
      getPopulationWithPersons: jest.fn(),
      createPopulation: jest.fn(),
      updatePopulation: jest.fn(),
      deletePopulation: jest.fn(),
    };

    const mockPersonDBService = {
      getall: jest.fn(),
      addPersonToPopulation: jest.fn(),
      updatePersonInPopulation: jest.fn(),
      removePersonPopulationRelation: jest.fn(),
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
      providers: [
        PopulationService,
        {
          provide: PopulationDBService,
          useValue: mockPopulationDBService,
        },
        {
          provide: PersonDBService,
          useValue: mockPersonDBService,
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

    service = module.get<PopulationService>(PopulationService);
    populationDBService = module.get(PopulationDBService);
    personDBService = module.get(PersonDBService);
    fileStorageService = module.get(FileStorageService);
    queue = module.get('BullQueue_population');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });

  describe('getPopulations', () => {
    it('should return populations for user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const page = 1;
      const limit = 10;
      const expectedPopulations = [mockPopulation];

      populationDBService.getPopulationsForUser.mockResolvedValue(expectedPopulations);

      const result = await service.getPopulations(userId, page, limit);

      expect(result).toEqual(expectedPopulations);
      expect(populationDBService.getPopulationsForUser).toHaveBeenCalledWith(userId, page, limit);
    });

    it('should return populations without pagination', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedPopulations = [mockPopulation];

      populationDBService.getPopulationsForUser.mockResolvedValue(expectedPopulations);

      const result = await service.getPopulations(userId);

      expect(result).toEqual(expectedPopulations);
      expect(populationDBService.getPopulationsForUser).toHaveBeenCalledWith(userId, undefined, undefined);
    });
  });

  describe('getPoplation', () => {
    it('should return population when found and user has access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      const result = await service.getPoplation(populationId, userId);

      expect(result).toEqual(mockPopulation);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
    });

    it('should throw NotFoundException when population does not exist', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.getPoplation(populationId, userId)).rejects.toThrow(NotFoundException);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.getPoplation(populationId, differentUserId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getPopulationWithPersons', () => {
    it('should return population with persons when found and user has access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const page = 1;
      const limit = 50;
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      const result = await service.getPopulationWithPersons(populationId, userId, page, limit);

      expect(result).toEqual(mockResponse);
      expect(populationDBService.getPopulationWithPersons).toHaveBeenCalledWith(populationId, page, limit);
    });

    it('should throw BadRequestException when limit exceeds 1999', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const page = 1;
      const limit = 2000;

      await expect(service.getPopulationWithPersons(populationId, userId, page, limit)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when population not found', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulationWithPersons.mockResolvedValue(null);

      await expect(service.getPopulationWithPersons(populationId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      await expect(service.getPopulationWithPersons(populationId, differentUserId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllPerson', () => {
    it('should return all persons', async () => {
      const expectedPersons = [mockPerson];

      personDBService.getall.mockResolvedValue(expectedPersons);

      const result = await service.getAllPerson();

      expect(result).toEqual(expectedPersons);
      expect(personDBService.getall).toHaveBeenCalled();
    });
  });

  describe('createPopulation', () => {
    it('should create population successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const name = 'New Population';
      const parentPopulation = mockPopulation;
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const status = 'completed' as const;

      populationDBService.createPopulation.mockResolvedValue(mockPopulation);

      const result = await service.createPopulation(userId, name, parentPopulation, jobId, status);

      expect(result).toEqual(mockPopulation);
      expect(populationDBService.createPopulation).toHaveBeenCalledWith(name, userId, parentPopulation, jobId, status);
    });

    it('should create population with default status', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const name = 'New Population';

      populationDBService.createPopulation.mockResolvedValue(mockPopulation);

      const result = await service.createPopulation(userId, name);

      expect(result).toEqual(mockPopulation);
      expect(populationDBService.createPopulation).toHaveBeenCalledWith(name, userId, undefined, undefined, 'completed');
    });
  });

  describe('filterPopulation', () => {
    it('should filter population successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          },
        ],
      };
      const page = 1;
      const pageSize = 50;
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      const result = await service.filterPopulation(userId, populationId, filter, page, pageSize);

      expect(result).toEqual([mockPerson]);
      expect(populationDBService.getPopulationWithPersons).toHaveBeenCalledWith(populationId, page, pageSize);
    });

    it('should throw NotFoundException when population not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };
      const page = 1;
      const pageSize = 50;

      populationDBService.getPopulationWithPersons.mockResolvedValue(null);

      await expect(service.filterPopulation(userId, populationId, filter, page, pageSize)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174564';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };
      const page = 1;
      const pageSize = 50;
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      await expect(service.filterPopulation(differentUserId, populationId, filter, page, pageSize)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('uploadPopulationAsync', () => {
    it('should upload population successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const filePath = '/path/to/file.csv';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      populationDBService.updatePopulation.mockResolvedValue(mockPopulation);
      queue.add.mockResolvedValue({} as any);

      const result = await service.uploadPopulationAsync(populationId, userId, filePath);

      expect(result).toEqual(mockPopulation);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
      expect(populationDBService.updatePopulation).toHaveBeenCalledWith(populationId, undefined, 'queued', undefined, expect.any(String));
      expect(queue.add).toHaveBeenCalledWith('upload', expect.any(Object), expect.any(Object));
    });

    it('should throw NotFoundException when population not found', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const filePath = '/path/to/file.csv';

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.uploadPopulationAsync(populationId, userId, filePath)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';
      const filePath = '/path/to/file.csv';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.uploadPopulationAsync(populationId, differentUserId, filePath)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException when population is queued or working', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const filePath = '/path/to/file.csv';
      const queuedPopulation = { ...mockPopulation, status: 'queued' as const };

      populationDBService.getPopulation.mockResolvedValue(queuedPopulation);

      await expect(service.uploadPopulationAsync(populationId, userId, filePath)).rejects.toThrow(ConflictException);
    });

    it('should clean up file and update status to failed on error', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const filePath = '/path/to/file.csv';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      populationDBService.updatePopulation.mockRejectedValue(new Error('Queue error'));

      await expect(service.uploadPopulationAsync(populationId, userId, filePath)).rejects.toThrow(Error);
      expect(fileStorageService.delete).toHaveBeenCalledWith(filePath);
      expect(populationDBService.updatePopulation).toHaveBeenCalledWith(populationId, undefined, 'failed');
    });
  });

  describe('createSegmentationAsync', () => {
    it('should create segmentation successfully', async () => {
      const segmentName = 'New Segment';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const parentPopulationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);
      populationDBService.createPopulation.mockResolvedValue(mockPopulation);
      queue.add.mockResolvedValue({} as any);

      const result = await service.createSegmentationAsync(segmentName, userId, parentPopulationId, filter);

      expect(result).toEqual(mockPopulation);
      expect(populationDBService.getPopulationWithPersons).toHaveBeenCalledWith(parentPopulationId);
      expect(populationDBService.createPopulation).toHaveBeenCalledWith(segmentName, userId, mockPopulation, expect.any(String), 'queued');
      expect(queue.add).toHaveBeenCalledWith('segmentation', expect.any(Object), expect.any(Object));
    });

    it('should throw NotFoundException when parent population not found', async () => {
      const segmentName = 'New Segment';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const parentPopulationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(null);

      await expect(service.createSegmentationAsync(segmentName, userId, parentPopulationId, filter)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access to parent population', async () => {
      const segmentName = 'New Segment';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';
      const parentPopulationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };
      const mockResponse = {
        population: mockPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      await expect(service.createSegmentationAsync(segmentName, differentUserId, parentPopulationId, filter)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException when parent population is queued or working', async () => {
      const segmentName = 'New Segment';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const parentPopulationId = '123e4567-e89b-12d3-a456-426614174000';
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [],
      };
      const queuedPopulation = { ...mockPopulation, status: 'queued' as const };
      const mockResponse = {
        population: queuedPopulation,
        persons: [mockPerson],
        total: 1,
      };

      populationDBService.getPopulationWithPersons.mockResolvedValue(mockResponse);

      await expect(service.createSegmentationAsync(segmentName, userId, parentPopulationId, filter)).rejects.toThrow(ConflictException);
    });
  });

  describe('createPersonAndAddToPopulation', () => {
    it('should create person and add to population successfully', async () => {
      const person = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test Person',
        customFields: { department: 'Engineering' },
      };
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      personDBService.addPersonToPopulation.mockResolvedValue(mockPerson);

      const result = await service.createPersonAndAddToPopulation(person, userId, populationId);

      expect(result).toEqual(mockPerson);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
      expect(personDBService.addPersonToPopulation).toHaveBeenCalledWith(person, populationId);
    });

    it('should throw NotFoundException when population not found', async () => {
      const person = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test Person',
        customFields: { department: 'Engineering' },
      };
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.createPersonAndAddToPopulation(person, userId, populationId)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const person = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test Person',
        customFields: { department: 'Engineering' },
      };
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';
      const populationId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.createPersonAndAddToPopulation(person, differentUserId, populationId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deletePopulation', () => {
    it('should delete population successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      populationDBService.deletePopulation.mockResolvedValue(true);

      const result = await service.deletePopulation(populationId, userId);

      expect(result).toBe(true);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
      expect(populationDBService.deletePopulation).toHaveBeenCalledWith(populationId);
    });

    it('should throw NotFoundException when population not found', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.deletePopulation(populationId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.deletePopulation(populationId, differentUserId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updatePersonFromPopulation', () => {
    it('should update person successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';
      const personUpdate = { name: 'Updated Name' };

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      personDBService.updatePersonInPopulation.mockResolvedValue(true);

      const result = await service.updatePersonFromPopulation(populationId, userId, personId, personUpdate);

      expect(result).toBe(true);
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
      expect(personDBService.updatePersonInPopulation).toHaveBeenCalledWith(personId, personUpdate);
    });

    it('should throw NotFoundException when population not found', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';
      const personUpdate = { name: 'Updated Name' };

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.updatePersonFromPopulation(populationId, userId, personId, personUpdate)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';
      const personId = '123e4567-e89b-12d3-a456-426614174001';
      const personUpdate = { name: 'Updated Name' };

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.updatePersonFromPopulation(populationId, differentUserId, personId, personUpdate)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deletePersonFromPopulation', () => {
    it('should delete person from population successfully', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);
      personDBService.removePersonPopulationRelation.mockResolvedValue(undefined);

      const result = await service.deletePersonFromPopulation(populationId, userId, personId);

      expect(result).toBeUndefined();
      expect(populationDBService.getPopulation).toHaveBeenCalledWith(populationId);
      expect(personDBService.removePersonPopulationRelation).toHaveBeenCalledWith(personId, populationId);
    });

    it('should throw NotFoundException when population not found', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const personId = '123e4567-e89b-12d3-a456-426614174001';

      populationDBService.getPopulation.mockResolvedValue(null);

      await expect(service.deletePersonFromPopulation(populationId, userId, personId)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user does not have access', async () => {
      const populationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174002';
      const personId = '123e4567-e89b-12d3-a456-426614174001';

      populationDBService.getPopulation.mockResolvedValue(mockPopulation);

      await expect(service.deletePersonFromPopulation(populationId, differentUserId, personId)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 