import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../database/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    avatarUrl: null,
    timezone: 'UTC',
    createdAt: new Date(),
    habits: [],
    checkIns: [],
  };

  const mockAuthResponse = {
    accessToken: 'jwt-token-here',
    user: {
      id: mockUser.id,
      email: mockUser.email,
      displayName: mockUser.displayName,
      timezone: mockUser.timezone,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'securepassword123',
      timezone: 'UTC',
    };

    it('should register a new user and return auth response', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException for duplicate email', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return auth response for valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const req = { user: mockUser };
      const result = await controller.login(req);

      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const { passwordHash: _, ...profileWithoutPassword } = mockUser;
      authService.getProfile.mockResolvedValue(profileWithoutPassword);

      const result = await controller.getProfile(mockUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(mockUser.email);
      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      authService.getProfile.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      await expect(controller.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
