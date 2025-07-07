import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Questionnaire } from '../entities/questionnaire.entity';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;

  const baseUser: User = {
    id: 'user-uuid',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed',
    questionnaires: [],
    populations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          find: jest.fn(),
        }},
      ],
    }).compile();
    service = module.get(UserService);
    repo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by id', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser });
    const result = await service.findById('user-uuid');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid' }, relations: ['questionnaires'] });
    expect(result).toEqual(baseUser);
  });

  it('should return null if user not found by id', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.findById('not-exist');
    expect(result).toBeNull();
  });

  it('should find user by email', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser });
    const result = await service.findByEmail('test@example.com');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(result).toEqual(baseUser);
  });

  it('should return null if user not found by email', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.findByEmail('notfound@example.com');
    expect(result).toBeNull();
  });

  it('should create a new user', async () => {
    const userData = { email: 'a@b.com', name: 'A', password: 'pw' };
    const created = { ...baseUser, ...userData };
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);
    const result = await service.createNewUser(userData);
    expect(repo.create).toHaveBeenCalledWith(userData);
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  it('should update a user', async () => {
    repo.update.mockResolvedValue({} as any);
    const result = await service.update('user-uuid', { name: 'New' });
    expect(repo.update).toHaveBeenCalledWith('user-uuid', { name: 'New' });
    expect(result).toBe(true);
  });

  it('should return false if update throws', async () => {
    repo.update.mockRejectedValue(new Error('fail'));
    const result = await service.update('user-uuid', { name: 'New' });
    expect(result).toBe(false);
  });

  it('should delete a user', async () => {
    repo.delete.mockResolvedValue({} as any);
    jest.spyOn(service, 'findById').mockResolvedValue(null);
    const result = await service.delete('user-uuid');
    expect(repo.delete).toHaveBeenCalledWith('user-uuid');
    expect(result).toBe(true);
  });

  it('should find all users', async () => {
    repo.find.mockResolvedValue([baseUser]);
    const result = await service.findAll();
    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([baseUser]);
  });

  it('should get questionnaires for a user', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser, questionnaires: [{ id: 'q1' } as Questionnaire] });
    const result = await service.getQuestionnaires('user-uuid');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid' }, relations: ['questionnaires'] });
    expect(result).toEqual([{ id: 'q1' }]);
  });

  it('should return null if user not found for questionnaires', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.getQuestionnaires('not-exist');
    expect(result).toBeNull();
  });
}); 