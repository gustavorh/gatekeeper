import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE_FALLBACK,
} from '../../application/constants/auth-cookies';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Obtener el usuario completo desde la base de datos
      const user = await this.userRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const organizationId = payload.organizationId || 'gatekeeper-default';
      if (!organizationId) {
        throw new UnauthorizedException('No active organization in session');
      }

      request['user'] = {
        ...user,
        organizationId,
      };
    } catch {
      throw new UnauthorizedException();
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
