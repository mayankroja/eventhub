import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@test.com', name: 'Test', password: 'pass' };
      mockAuthService.register.mockResolvedValue({ id: '1' });
      const result = await controller.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        dto.password,
      );
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('login', () => {
    it('should return token', async () => {
      const dto = { email: 'test@test.com', password: 'pass' };
      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      mockAuthService.login.mockReturnValue({ access_token: 'token' });
      await controller.login(dto, mockResponse);
      expect(mockResponse.json).toHaveBeenCalledWith({ access_token: 'token' });
    });
  });
});
