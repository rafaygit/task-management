import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@task-app/auth/backend';
import { RoleType } from '@task-app/data';
import { AuthenticatedUser } from '../auth/interfaces/user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  create(@Req() req: { user: AuthenticatedUser }, @Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogService.create(createAuditLogDto);
  }

  @Get()
  @Roles(RoleType.OWNER, RoleType.ADMIN, RoleType.VIEWER)
  findAll(@Req() req: { user: AuthenticatedUser }) {
    return this.auditLogService.getAllLogs();
  }

  @Get(':id')
  @Roles(RoleType.OWNER, RoleType.ADMIN, RoleType.VIEWER)
  findOne(@Req() req: { user: AuthenticatedUser }, @Param('id') id: string) {
    return this.auditLogService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  update(@Req() req: { user: AuthenticatedUser }, @Param('id') id: string, @Body() updateAuditLogDto: UpdateAuditLogDto) {
    return this.auditLogService.update(+id, updateAuditLogDto);
  }

  @Delete(':id')
  @Roles(RoleType.OWNER)
  remove(@Req() req: { user: AuthenticatedUser }, @Param('id') id: string) {
    return this.auditLogService.remove(+id);
  }
}
