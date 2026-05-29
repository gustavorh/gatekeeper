import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import type { JwtPayload } from '../../application/types/jwt-payload';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

/**
 * OwnershipGuard — prevents IDOR on endpoints that expose data by :userId param.
 *
 * Allows the request when:
 *  - The :userId param matches the authenticated user's id (owner), OR
 *  - The authenticated user has an admin or super_admin role (from DB).
 *
 * Usage: @UseGuards(JwtAuthGuard, OwnershipGuard)
 * The guard reads `request.params.userId` and `request.user` (set by JwtAuthGuard).
 * For admin role resolution it queries the DB (same pattern as AdminAuthGuard).
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: Record<string, string>;
      user: JwtPayload;
    }>();

    const user = request.user;
    const targetUserId = request.params.userId;

    // If there is no userId param this guard is misconfigured — deny by default.
    if (!targetUserId) {
      throw new ForbiddenException('Missing userId parameter');
    }

    // Owner of the resource: allow immediately without DB query
    if (user.id === targetUserId) {
      return true;
    }

    // Check if the authenticated user has an elevated role that allows cross-user access
    const userRoles = await this.roleRepository.findUserRoles(user.id);
    const isAdmin = userRoles.some(
      (role) =>
        role.isActive &&
        (role.name === 'admin' ||
          role.name === 'super_admin' ||
          role.name === 'ADMIN' ||
          role.name === 'SUPER_ADMIN'),
    );

    if (isAdmin) {
      return true;
    }

    throw new ForbiddenException(
      'Access denied: you can only access your own data',
    );
  }
}
