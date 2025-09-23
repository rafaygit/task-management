import { Test, TestingModule } from '@nestjs/testing';
import { TaskGuard } from './task.guard';
import { DataSource, Repository } from 'typeorm';
import { Task } from '../../task/entities/task.entity';
import { Organization } from '../../organization/entities/organization.entity';

describe('TaskGuard', () => {
  let guard: TaskGuard;
  let dataSource: DataSource;
  let taskRepository: Repository<Task>;
  let organizationRepository: Repository<Organization>;

  const mockDataSource = {
    getRepository: jest.fn(),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  const mockOrganizationRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskGuard,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    guard = module.get<TaskGuard>(TaskGuard);
    dataSource = module.get<DataSource>(DataSource);
    
    mockDataSource.getRepository.mockImplementation((entity) => {
      if (entity === Task) return mockTaskRepository;
      if (entity === Organization) return mockOrganizationRepository;
      return {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    const mockRequest = {
      user: {
        userId: 1,
        orgId: 1,
        role: 'Owner',
      },
      params: { id: '1' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    it('should return false if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization', 'assignedTo'],
      });
    });

    it('should allow Owner to access tasks in their organization', async () => {
      const mockTask = {
        id: 1,
        organization: { id: 1 },
        assignedTo: { id: 2 },
      };
      const mockChildOrgs = [{ id: 2 }, { id: 3 }];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.find.mockResolvedValue(mockChildOrgs);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockOrganizationRepository.find).toHaveBeenCalledWith({
        where: { parent: { id: 1 } },
      });
    });

    it('should allow Admin to access tasks in their organization', async () => {
      const mockRequest = {
        user: {
          userId: 1,
          orgId: 1,
          role: 'Admin',
        },
        params: { id: '1' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const mockTask = {
        id: 1,
        organization: { id: 1 },
        assignedTo: { id: 2 },
      };
      const mockChildOrgs = [{ id: 2 }];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.find.mockResolvedValue(mockChildOrgs);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow Viewer to access only their own tasks', async () => {
      const mockRequest = {
        user: {
          userId: 1,
          orgId: 1,
          role: 'Viewer',
        },
        params: { id: '1' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const mockTask = {
        id: 1,
        organization: { id: 1 },
        assignedTo: { id: 1 }, // Same as user ID
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny Viewer access to tasks assigned to others', async () => {
      const mockRequest = {
        user: {
          userId: 1,
          orgId: 1,
          role: 'Viewer',
        },
        params: { id: '1' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const mockTask = {
        id: 1,
        organization: { id: 1 },
        assignedTo: { id: 2 }, // Different from user ID
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should deny access to tasks in different organizations', async () => {
      const mockTask = {
        id: 1,
        organization: { id: 5 }, // Different org
        assignedTo: { id: 2 },
      };
      const mockChildOrgs = [{ id: 2 }, { id: 3 }];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.find.mockResolvedValue(mockChildOrgs);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false for unknown roles', async () => {
      const mockRequest = {
        user: {
          userId: 1,
          orgId: 1,
          role: 'UnknownRole',
        },
        params: { id: '1' },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const mockTask = {
        id: 1,
        organization: { id: 1 },
        assignedTo: { id: 2 },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});
