import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@task-app/auth/backend';
import { TaskGuard } from '../auth/guards/task.guard';
import { RoleType } from '@task-app/libs';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;

  const mockTaskService = {
    createTask: jest.fn(),
    findAccessibleTasks: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 1,
      username: 'testuser',
      role: 'Owner',
      orgId: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TaskGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        organizationId: 1,
        assignedToId: 1,
      };

      const expectedResult = {
        id: 1,
        title: 'New Task',
        description: 'Task Description',
        completed: false,
        organization: { id: 1, name: 'Test Org' },
      };

      mockTaskService.createTask.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest, createTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockTaskService.createTask).toHaveBeenCalledWith(createTaskDto, mockRequest.user);
    });
  });

  describe('findAll', () => {
    it('should return all accessible tasks', async () => {
      const expectedTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          completed: false,
          organization: { id: 1, name: 'Test Org' },
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          completed: true,
          organization: { id: 1, name: 'Test Org' },
        },
      ];

      mockTaskService.findAccessibleTasks.mockResolvedValue(expectedTasks);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(expectedTasks);
      expect(mockTaskService.findAccessibleTasks).toHaveBeenCalledWith(mockRequest.user);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = '1';
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        completed: true,
      };

      const expectedResult = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated Description',
        completed: true,
        organization: { id: 1, name: 'Test Org' },
      };

      mockTaskService.updateTask.mockResolvedValue(expectedResult);

      const result = await controller.update(mockRequest, taskId, updateTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(1, updateTaskDto, mockRequest.user);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = '1';
      const expectedResult = {
        id: 1,
        title: 'Deleted Task',
        description: 'Description',
        completed: false,
        organization: { id: 1, name: 'Test Org' },
      };

      mockTaskService.deleteTask.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockRequest, taskId);

      expect(result).toEqual(expectedResult);
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(1, mockRequest.user);
    });
  });
});