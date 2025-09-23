import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: DataSource;
  let jwtService: JwtService;

  const mockDataSource = {
    getRepository: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dataSource = module.get<DataSource>(DataSource);
    jwtService = module.get<JwtService>(JwtService);
    
    mockDataSource.getRepository.mockReturnValue(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: { name: 'Owner' },
        organization: { id: 1, name: 'Test Org' },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        relations: ['role', 'organization'],
      });
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: { name: 'Owner' },
        organization: { id: 1, name: 'Test Org' },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: { name: 'Owner' },
        organization: { id: 1 },
      } as User;

      const mockToken = 'mock-jwt-token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser);

      expect(result).toEqual({
        access_token: mockToken,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 1,
        role: 'Owner',
        orgId: 1,
      });
    });
  });

});