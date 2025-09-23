import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { RoleType } from "@task-app/libs";
import { Permission } from "../../permission/entities/permission.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn() 
  id: number;
  @Column({
    type: 'enum',
    enum: RoleType,
    unique: true,
  }) 
  name: RoleType;
  @OneToMany(() => User, (user) => user.role) 
  users: User[];
  @OneToMany(() => Permission, (perm) => perm.role)
  permissions: Permission[];
}