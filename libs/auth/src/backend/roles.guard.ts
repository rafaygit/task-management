import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_METADATA_KEY } from '../shared/roles';
import { RoleType } from '@task-app/data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_METADATA_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role: RoleType = user?.role;

    const inherits: Record<RoleType, RoleType[]> = {
      [RoleType.OWNER]: [RoleType.OWNER, RoleType.ADMIN, RoleType.VIEWER],
      [RoleType.ADMIN]: [RoleType.ADMIN, RoleType.VIEWER],
      [RoleType.VIEWER]: [RoleType.VIEWER],
    };

    const userCapabilities = inherits[role as RoleType] || [role as RoleType];
    return requiredRoles.some((needed) => userCapabilities.includes(needed as RoleType));
  }
}


