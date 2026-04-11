import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, verify JWT authentication
    const isJwtValid = await this.jwtAuthGuard.canActivate(context);
    if (!isJwtValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has admin role
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
