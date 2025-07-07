import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserService } from '@app/database';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let module: TestingModule 
  const mockUserService = {
    findByEmail: jest.fn(),
    createNewUser: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });
  afterAll(async ()=>{
    await module.close();
  })
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const userData = { name: 'New User', email: 'new@user.com', password: '123456' };

    mockUserService.findByEmail.mockResolvedValue(null);
    mockUserService.createNewUser.mockImplementation(async ({ name, email, password }) => ({
      _id: 'id123',
      name,
      email,
      password,
    }));

    const result = await service.register(userData);

    expect(mockUserService.findByEmail).toHaveBeenCalledWith('new@user.com');
    expect(result).toHaveProperty('email', 'new@user.com');
    expect(result).toHaveProperty('name', 'New User');
  });

  it('testing the login', async () => {
    const userLoginData = new User();
    userLoginData.email = "tester@gmail.com";
    userLoginData.id = "adsgasdhg";
    userLoginData.password = "123456";
    userLoginData.name = "tester";
    userLoginData.updatedAt = new Date();
    userLoginData.createdAt = new Date();
    mockJwtService.sign.mockResolvedValue('mock-jwt-token');
    const result =service.login(userLoginData);
    expect(result).toHaveProperty('access_token');
  });

  it('validate the user',async()=>{
    const userFound = new User();
    userFound.email = "tester@gmail.com";
    userFound.id = "adsgasdhg";
    userFound.password = "123456";
    userFound.name = "tester";
    userFound.updatedAt = new Date();
    userFound.createdAt = new Date();
    mockUserService.findByEmail.mockImplementation((email)=>userFound);
    const result=await service.validateUser({email:"tester@gmail.com",password:"123456"});
    expect(mockUserService.findByEmail).toHaveBeenCalledWith('tester@gmail.com');
  })

  it('delete the user',async ()=>{
    mockUserService.delete.mockImplementation((id:string)=>true);
    const result=await service.delete("id#1");
    expect(mockUserService.delete).toHaveBeenCalledWith("id#1");
    expect(result).toBe(true);
  })

});
