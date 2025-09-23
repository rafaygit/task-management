import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let auditLogService: AuditLogService;

  const mockTaskRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockOrganizationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditLogService = {
    createLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAccessibleTasks', () => {
    it('should return all tasks for Owner role', async () => {
      const mockUser = {
        userId: 1,
        orgId: 1,
        role: 'Owner',
      };

      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          completed: false,
          assignedTo: { id: 1, username: 'user1' },
          organization: { id: 1, name: 'Org 1' },
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          completed: true,
          assignedTo: { id: 2, username: 'user2' },
          organization: { id: 1, name: 'Org 1' },
        },
      ];

      const mockChildOrgs = [{ id: 2 }, { id: 3 }];
      mockOrganizationRepository.find.mockResolvedValue(mockChildOrgs);
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAccessibleTasks(mockUser);

      expect(result).toHaveLength(2);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { organization: { id: In([1, 2, 3]) } },
        relations: ['assignedTo', 'assignedTo.role', 'organization'],
      });
    });

    it('should return all tasks for Admin role', async () => {
      const mockUser = {
        userId: 1,
        orgId: 1,
        role: 'Admin',
      };

      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          completed: false,
          assignedTo: { id: 1, username: 'user1' },
          organization: { id: 1, name: 'Org 1' },
        },
      ];

      const mockChildOrgs = [{ id: 2 }];
      mockOrganizationRepository.find.mockResolvedValue(mockChildOrgs);
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAccessibleTasks(mockUser);

      expect(result).toHaveLength(1);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { organization: { id: In([1, 2]) } },
        relations: ['assignedTo', 'assignedTo.role', 'organization'],
      });
    });

    it('should return only assigned tasks for Viewer role', async () => {
      const mockUser = {
        userId: 1,
        orgId: 1,
        role: 'Viewer',
      };

      const mockTasks = [
        {
          id: 1,
          title: 'My Task',
          description: 'Description 1',
          completed: false,
          assignedTo: { id: 1, username: 'user1' },
          organization: { id: 1, name: 'Org 1' },
        },
      ];

      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAccessibleTasks(mockUser);

      expect(result).toHaveLength(1);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { assignedTo: { id: 1 } },
        relations: ['assignedTo', 'assignedTo.role', 'organization'],
      });
    });

    it('should return empty array for unknown role', async () => {
      const mockUser = {
        userId: 1,
        orgId: 1,
        role: 'UnknownRole',
      };

      const result = await service.findAccessibleTasks(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('should create task and log audit', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        organizationId: 1,
        assignedToId: 1,
      };

      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      const mockOrganization = { id: 1, name: 'Test Org' };
      const mockAssignedUser = { id: 1, username: 'user1', organization: { id: 1 } };
      const mockTask = {
        id: 1,
        title: 'New Task',
        description: 'Task Description',
        completed: false,
        organization: mockOrganization,
      };

      mockUserRepository.findOne.mockResolvedValue(mockAssignedUser);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.createTask(createTaskDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task Description',
        completed: false,
        assignedTo: mockAssignedUser,
        organization: mockOrganization,
      });
      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        'CREATE',
        'Task',
        1,
        'testuser'
      );
    });

    it('should throw error when organization not found', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        organizationId: 999,
        assignedToId: 1,
      };

      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      mockOrganizationRepository.findOne.mockResolvedValue(null);

      await expect(service.createTask(createTaskDto, mockUser)).rejects.toThrow(
        'Cannot create task outside your organization scope'
      );
    });
  });

  describe('updateTask', () => {
    it('should update task and log audit', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        completed: true,
      };

      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      const mockTask = {
        id: 1,
        title: 'Old Task',
        description: 'Old Description',
        completed: false,
        organization: { id: 1 },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue({ ...mockTask, ...updateTaskDto });

      const result = await service.updateTask(1, updateTaskDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        'UPDATE',
        'Task',
        1,
        'testuser'
      );
    });

    it('should throw error when task not found', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        completed: true,
      };

      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.updateTask(1, updateTaskDto, mockUser)).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete task and log audit', async () => {
      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      const mockTask = {
        id: 1,
        title: 'Task to Delete',
        description: 'Description',
        completed: false,
        organization: { id: 1 },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteTask(1, mockUser);

      expect(result).toBeDefined();
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(1);
      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        'DELETE',
        'Task',
        1,
        'testuser'
      );
    });

    it('should throw error when task not found', async () => {
      const mockUser = {
        userId: 1,
        username: 'testuser',
        role: 'Owner',
        orgId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(1, mockUser)).rejects.toThrow(
        'Task not found'
      );
    });
  });
});