import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuditLogService {
   constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(action: string, entityType: string, entityId: number, performedBy: string) {
    const log = this.auditLogRepository.create({ action, entityType, entityId, performedBy });
    console.log(`[AUDIT] ${performedBy} performed ${action} on ${entityType}#${entityId}`);
    return this.auditLogRepository.save(log);
  }

  async getAllLogs() {
    return this.auditLogRepository.find({ order: { timestamp: 'DESC' } });
  }

  create(createAuditLogDto: CreateAuditLogDto) {
    return 'This action adds a new auditLog';
  }

  findOne(id: number) {
    return `This action returns a #${id} auditLog`;
  }

  update(id: number, updateAuditLogDto: UpdateAuditLogDto) {
    return `This action updates a #${id} auditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLog`;
  }
}
