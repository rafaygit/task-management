import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../role/entities/role.entity";
import { Task } from "../../task/entities/task.entity";
import { Organization } from "../../organization/entities/organization.entity";
import { Exclude } from "class-transformer";

@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column() username: string;
  
  @Column()
  @Exclude() // Exclude password from serialization
  password: string;
  
  @ManyToOne(() => Role, (role) => role.users) role: Role;
  @ManyToOne(() => Organization, (org) => org.users) organization: Organization;
  @OneToMany(() => Task, (task) => task.assignedTo) tasks: Task[];
}
