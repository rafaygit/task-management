import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async getAccessibleOrgIdsForUser(user: any): Promise<Set<number>> {
    const children = await this.orgRepo.find({ where: { parent: { id: user.orgId } } });
    return new Set<number>([user.orgId, ...children.map((c) => c.id)]);
  }

  private mapTaskResponse(task: Task) {
    const assignedTo = task.assignedTo ? {
      id: task.assignedTo.id,
      username: task.assignedTo.username,
      role: task.assignedTo.role?.name
    } : null;

    const organization = task.organization ? {
      id: task.organization.id,
      name: task.organization.name
    } : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      assignedTo: assignedTo,
      organization: organization
    };
  }

  async createTask(createTaskDto: CreateTaskDto, user: any) {
    const { assignedToId, organizationId, title, description, completed } = createTaskDto;

    if (!title || !organizationId) throw new BadRequestException('title and organizationId are required');

    const accessibleOrgIds = await this.getAccessibleOrgIdsForUser(user);
    if (!accessibleOrgIds.has(organizationId)) {
      throw new ForbiddenException('Cannot create task outside your organization scope');
    }

    const organization = await this.orgRepo.findOne({ where: { id: organizationId } });
    if (!organization) throw new NotFoundException('Organization not found');

    let assignedTo: User | null = null;
    if (assignedToId) {
      assignedTo = await this.userRepo.findOne({ where: { id: assignedToId }, relations: ['organization'] });
      if (!assignedTo) throw new NotFoundException('Assigned user not found');
      if (!accessibleOrgIds.has(assignedTo.organization.id)) {
        throw new ForbiddenException('Assigned user outside your organization scope');
      }
    }

    const task = this.taskRepo.create({
      title: title,
      description: description,
      completed: completed ?? false,
      assignedTo: assignedTo || null,
      organization: organization
    });

    const savedTask = await this.taskRepo.save(task);
    await this.auditLogService.createLog('CREATE', 'Task', savedTask.id, user.username);
    return this.mapTaskResponse(savedTask);
  }

  async findAllTasks() {
    const tasks = await this.taskRepo.find({ relations: ['assignedTo', 'assignedTo.role', 'organization'] });
    const result = [];
    for (const t of tasks) {
      result.push(this.mapTaskResponse(t));
    }
    return result;
  }

  async updateTask(id: number, dto: UpdateTaskDto, user: any) {
    const existing = await this.taskRepo.findOne({ where: { id }, relations: ['organization', 'assignedTo', 'assignedTo.organization'] });
    if (!existing) throw new NotFoundException('Task not found');

    // Validate organization/assignee moves stay within scope
    const accessibleOrgIds = await this.getAccessibleOrgIdsForUser(user);
    if (dto.organizationId && !accessibleOrgIds.has(dto.organizationId)) {
      throw new ForbiddenException('Cannot move task outside your organization scope');
    }
    if (dto.assignedToId) {
      const newAssignee = await this.userRepo.findOne({ where: { id: dto.assignedToId }, relations: ['organization'] });
      if (!newAssignee) throw new NotFoundException('Assigned user not found');
      if (!accessibleOrgIds.has(newAssignee.organization.id)) {
        throw new ForbiddenException('Assigned user outside your organization scope');
      }
      (existing as any).assignedTo = newAssignee;
    }

    if (dto.title !== undefined) (existing as any).title = dto.title;
    if (dto.description !== undefined) (existing as any).description = dto.description;
    if (dto.completed !== undefined) (existing as any).completed = dto.completed;
    if (dto.organizationId !== undefined) {
      const newOrg = await this.orgRepo.findOne({ where: { id: dto.organizationId } });
      if (!newOrg) throw new NotFoundException('Organization not found');
      (existing as any).organization = newOrg;
    }

    const saved = await this.taskRepo.save(existing);
    await this.auditLogService.createLog('UPDATE', 'Task', saved.id, user.username);
    return this.mapTaskResponse(saved);
  }

  async deleteTask(id: number, user: any) {
    const taskToDelete = await this.taskRepo.findOne({ where: { id }, relations: ['assignedTo', 'assignedTo.role', 'organization'] });
    if (!taskToDelete) throw new NotFoundException('Task not found');
    await this.taskRepo.delete(id);
    await this.auditLogService.createLog('DELETE', 'Task', id, user.username);
    return this.mapTaskResponse(taskToDelete);
  }

  async findAccessibleTasks(user: any) {
    let tasks: Task[] = [];
    if (user.role === 'Owner' || user.role === 'Admin') {
      const accessibleOrgIds = await this.getAccessibleOrgIdsForUser(user);
      tasks = await this.taskRepo.find({
        where: { organization: { id: In(Array.from(accessibleOrgIds)) } },
        relations: ['assignedTo', 'assignedTo.role', 'organization']
      });
    } else if (user.role === 'Viewer') {
      tasks = await this.taskRepo.find({
        where: { assignedTo: { id: user.userId } },
        relations: ['assignedTo', 'assignedTo.role', 'organization']
      });
    }

    const result = [];
    for (const t of tasks) {
      result.push(this.mapTaskResponse(t));
    }
    return result;
  }
}
