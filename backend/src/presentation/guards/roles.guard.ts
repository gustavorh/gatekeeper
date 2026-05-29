import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '../../application/types/jwt-payload';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that checks whether the authenticated user has at least one of the
 * roles declared via @Roles(). Must run after JwtAuthGuard so that
 * request.user is already populated.
 *
 * Usage on a controller:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin', 'super_admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() annotation — route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user?.roles || user.roles.length === 0) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasRole = requiredRoles.some((r) =>
      user.roles!.map((role) => role.toLowerCase()).includes(r.toLowerCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
