import { DataSource } from 'typeorm';
import { User } from './user/entities/user.entity';
import { Role } from './role/entities/role.entity';
import { Organization } from './organization/entities/organization.entity';
import { Task } from './task/entities/task.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Role, Organization, Task],
  synchronize: true,
});
