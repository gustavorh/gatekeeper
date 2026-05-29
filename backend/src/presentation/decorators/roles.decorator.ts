import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Attaches required role names to a handler or controller class.
 * Consumed by RolesGuard.
 *
 * Usage:
 *   @Roles('admin', 'super_admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
