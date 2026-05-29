import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE_FALLBACK,
} from '../../application/constants/auth-cookies';

// jsonwebtoken error names — checked by name to avoid a direct import of
// the package which is a transitive (non-hoisted) dependency of @nestjs/jwt.
const JWT_ERROR_TOKEN_EXPIRED = 'TokenExpiredError';
const JWT_ERROR_INVALID = 'JsonWebTokenError';
const JWT_ERROR_NOT_BEFORE = 'NotBeforeError';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    let payload: { sub?: string; organizationId?: string } | undefined;

    try {
      payload = await this.jwtService.verifyAsync(token);

      // Obtener el usuario completo desde la base de datos
      const user = await this.userRepository.findById(payload.sub ?? '');

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const organizationId = payload.organizationId || 'gatekeeper-default';
      if (!organizationId) {
        throw new UnauthorizedException('No active organization in session');
      }

      // Load role names for RolesGuard — single query, cached by JwtAuthGuard result
      const userRoles = await this.roleRepository.findUserRoles(user.id);
      const roleNames = userRoles.map((r) => r.name);

      request['user'] = {
        ...user,
        organizationId,
        roles: roleNames,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errName = (error as { name?: string })?.name;
      const errMessage = (error as { message?: string })?.message ?? '';
      if (errName === JWT_ERROR_TOKEN_EXPIRED) {
        this.logger.warn({ msg: 'JWT expired', userId: payload?.sub });
        throw new UnauthorizedException('Token expired');
      }
      if (errName === JWT_ERROR_NOT_BEFORE) {
        this.logger.warn({ msg: 'JWT not yet valid' });
        throw new UnauthorizedException('Token not yet valid');
      }
      if (errName === JWT_ERROR_INVALID) {
        this.logger.warn({ msg: 'Invalid JWT', error: errMessage });
        throw new UnauthorizedException('Invalid token');
      }
      this.logger.error({ msg: 'Unexpected JWT validation error', error });
      throw new UnauthorizedException('Authentication failed');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;
    const cookies = (request as Request & { cookies?: Record<string, string> })
      .cookies;
    return (
      cookies?.[AUTH_TOKEN_COOKIE] ?? cookies?.[AUTH_TOKEN_COOKIE_FALLBACK]
    );
  }
}
