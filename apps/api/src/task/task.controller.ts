import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '@task-app/auth/backend';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@task-app/auth/backend';
import { TaskGuard } from '../auth/guards/task.guard';
import { RoleType } from '@task-app/libs';
import { AuthenticatedUser } from '../auth/interfaces/user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('task')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  create(@Req() req: { user: AuthenticatedUser }, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto, req.user);
  }

  @Get()
  @Roles(RoleType.OWNER, RoleType.ADMIN, RoleType.VIEWER)
  findAll(@Req() req: { user: AuthenticatedUser }) {
    return this.tasksService.findAccessibleTasks(req.user);
  }

  @Put(':id')
  @UseGuards(TaskGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  update(@Req() req: { user: AuthenticatedUser }, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateTask(+id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(TaskGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  remove(@Req() req: { user: AuthenticatedUser }, @Param('id') id: string) {
    return this.tasksService.deleteTask(+id, req.user);
  }
}
