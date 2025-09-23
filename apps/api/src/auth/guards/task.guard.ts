import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Task } from '../../task/entities/task.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Injectable()
export class TaskGuard implements CanActivate {
  constructor(private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const taskId = +request.params.id;

    const task = await this.dataSource.getRepository(Task).findOne({
      where: { id: taskId },
      relations: ['organization', 'assignedTo'],
    });

    if (!task) return false;

    // Build accessible org ids: user's org + its direct children (2-level hierarchy)
    const childOrgs = await this.dataSource.getRepository(Organization).find({ where: { parent: { id: user.orgId } } });
    const accessibleOrgIds = new Set<number>([user.orgId, ...childOrgs.map((o) => o.id)]);

    // Owners/Admins of accessible orgs can access
    if (user.role === 'Owner' || user.role === 'Admin') {
      return accessibleOrgIds.has(task.organization.id);
    }

    // Viewer can only access their own tasks
    if (user.role === 'Viewer') {
      return task.assignedTo.id === user.userId;
    }

    return false;
  }
}
