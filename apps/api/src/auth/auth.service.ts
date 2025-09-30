import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
      relations: ['role', 'organization'],
    });
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = { username: user.username, sub: user.id, role: user.role.name, orgId: user.organization.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  create(createAuthDto: unknown) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: unknown) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
