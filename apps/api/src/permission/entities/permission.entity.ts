import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, ManyToOne } from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string; // e.g., 'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK'

  @ManyToOne(() => Role, (role) => role.permissions)
  role: Role;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization; // null = global for role
}
