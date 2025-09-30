import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
  @InjectRepository(User) private userRepo: Repository<User>) {}
  
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // Create user with hashed password, excluding password from response
    const user = this.userRepo.create({
      username: createUserDto.username,
      password: hashedPassword,
      role: createUserDto.roleId ? { id: createUserDto.roleId } : undefined,
      organization: createUserDto.organizationId ? { id: createUserDto.organizationId } : undefined,
    });
    
    const savedUser = await this.userRepo.save(user);
    
    // Return user without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  findAll() {
    return this.userRepo.find({
      relations: ['role', 'organization'],
      select: ['id', 'username', 'role', 'organization']
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'organization'],
      select: ['id', 'username', 'role', 'organization']
    });
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
