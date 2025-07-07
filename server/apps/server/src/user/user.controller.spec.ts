import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { AuthService } from '@app/auth';
import { User } from '@app/database';

describe('UserController', () => {
  let controller: UserController;
  let module: TestingModule;
  const mockAuthService = {
    register: jest.fn(),
    delete: jest.fn(),
    login: jest.fn()
  };

  const req = { user: new User() }
  req.user.email = "test@gmail.com";
  req.user.name = "test";
  req.user.updatedAt = req.user.createdAt = new Date();
  req.user.id = "idtest";
  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });
  afterAll(async () => {
    await module.close();
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const body = { name: 'Test User', email: 'shatwikpandey@gmail.com', password: 'password123' };
    mockAuthService.register.mockResolvedValue({ name: 'Test User', email: 'shatwikpandey@gmail.com', password: 'password123' });
    const result = await controller.register(body);
    expect(result).toHaveProperty('name', body.name);
    expect(result).toHaveProperty('email', body.email);
    expect(mockAuthService.register).toHaveBeenCalledWith(body);
  });


  it('should login a user', async () => {
    mockAuthService.login.mockImplementation((user: User) => ({ access_token: "access_token" }));
    const result = await controller.login(req);
    expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
    expect(result).toHaveProperty("access_token", 'access_token');
  })

  it("get profile", () => {
    const result = controller.getProfile(req)
    expect(result).toBe(req.user);
  })

  it("delete profile", async () => {
    mockAuthService.delete.mockImplementation((id: string) => true);
    const result = await controller.deleteProfile(req)
    expect(result).toHaveProperty("success", true);
  })

});
