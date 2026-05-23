import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;

    const userRoles = await this.roleRepository.findUserRoles(user.id);
    const hasAdminRole = userRoles.some(
      (role) => role.name === 'admin' && role.isActive,
    );

    if (!hasAdminRole) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
