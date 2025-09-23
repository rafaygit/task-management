import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { Task } from '../task/entities/task.entity';
import { RoleType } from '@task-app/libs';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const roleRepo = this.dataSource.getRepository(Role);
    const orgRepo = this.dataSource.getRepository(Organization);
    const userRepo = this.dataSource.getRepository(User);
    const taskRepo = this.dataSource.getRepository(Task);

//Roles
    const roleNames = [RoleType.OWNER, RoleType.ADMIN, RoleType.VIEWER];
    const roles: Role[] = [];
    for (const r of roleNames) {
      let role = await roleRepo.findOne({ where: { name: r } });
      if (!role) {
        role = roleRepo.create({ name: r });
        await roleRepo.save(role);
      }
      roles.push(role);
    }

//Organizations
    let mainOrg = await orgRepo.findOne({ where: { name: 'Main Organization' } });
    if (!mainOrg) {
      mainOrg = orgRepo.create({ name: 'Main Organization' });
      await orgRepo.save(mainOrg);
    }

    let subOrg1 = await orgRepo.findOne({ where: { name: 'Sub Org 1' } });
    if (!subOrg1) {
      subOrg1 = orgRepo.create({ name: 'Sub Org 1', parent: mainOrg });
      await orgRepo.save(subOrg1);
    }
    let subOrg2 = await orgRepo.findOne({ where: { name: 'Sub Org 2' } });
    if (!subOrg2) {
      subOrg2 = orgRepo.create({ name: 'Sub Org 2', parent: mainOrg });
      await orgRepo.save(subOrg2);
    }

//Users
    const ensureUser = async (username: string, role: Role, organization: Organization) => {
      let user = await userRepo.findOne({ where: { username } });
      if (!user) {
        user = userRepo.create({
          username,
          password: await bcrypt.hash('pass123', 10),
          role,
          organization,
        });
        user = await userRepo.save(user);
      }
      return user;
    };

    const owner1 = await ensureUser('owner1', roles.find(r => r.name === RoleType.OWNER)!, mainOrg);
    const owner2 = await ensureUser('owner2', roles.find(r => r.name === RoleType.OWNER)!, mainOrg);
    const admin1 = await ensureUser('admin1', roles.find(r => r.name === RoleType.ADMIN)!, subOrg1);
    const admin2 = await ensureUser('admin2', roles.find(r => r.name === RoleType.ADMIN)!, subOrg2);
    const viewer1 = await ensureUser('viewer1', roles.find(r => r.name === RoleType.VIEWER)!, subOrg2);
    const viewer2 = await ensureUser('viewer2', roles.find(r => r.name === RoleType.VIEWER)!, subOrg1);

//Tasks
    const maybeCreateTask = async (title: string, description: string, assignedTo: User, organization: Organization) => {
      const existing = await taskRepo.findOne({ where: { title, organization: { id: organization.id } }, relations: ['organization'] });
      if (!existing) {
        await taskRepo.save(taskRepo.create({ title, description, completed: false, assignedTo, organization }));
      }
    };

    await maybeCreateTask('Main Org Task 1', 'Task for Main Org Owner', owner1, mainOrg);
    await maybeCreateTask('Main Org Task 2', 'Another task for Main Org', owner2, mainOrg);
    await maybeCreateTask('Sub Org 1 Task 1', 'Task for Sub Org 1 Admin', admin1, subOrg1);
    await maybeCreateTask('Sub Org 1 Task 2', 'Viewer in Sub Org 1', viewer2, subOrg1);
    await maybeCreateTask('Sub Org 2 Task 1', 'Task for Sub Org 2 Admin', admin2, subOrg2);
    await maybeCreateTask('Sub Org 2 Task 2', 'Task for Sub Org 2 Viewer', viewer1, subOrg2);
    
    const unassignedExists1 = await taskRepo.findOne({ where: { title: 'Main Org Unassigned', organization: { id: mainOrg.id } }, relations: ['organization'] });
    if (!unassignedExists1) await taskRepo.save(taskRepo.create({ title: 'Main Org Unassigned', description: 'Unassigned task in Main', completed: false, organization: mainOrg } as any));
    const unassignedExists2 = await taskRepo.findOne({ where: { title: 'Sub Org 1 Unassigned', organization: { id: subOrg1.id } }, relations: ['organization'] });
    if (!unassignedExists2) await taskRepo.save(taskRepo.create({ title: 'Sub Org 1 Unassigned', description: 'Unassigned task in Sub1', completed: false, organization: subOrg1 } as any));

    console.log('Database seeded');
  }
}
