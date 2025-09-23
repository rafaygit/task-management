import { SetMetadata } from '@nestjs/common';
import { ROLES_METADATA_KEY } from '../shared/roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_METADATA_KEY, roles);


