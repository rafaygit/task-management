import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Organization } from "../../organization/entities/organization.entity";

@Entity()
export class Task {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ nullable: true }) description: string;
  @Column({ default: false }) completed: boolean;
  @ManyToOne(() => User, (user) => user.tasks, { nullable: true }) assignedTo: User;
  @ManyToOne(() => Organization, (org) => org.tasks) organization: Organization;
}
