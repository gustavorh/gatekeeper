import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../application/dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const endpoint = request.url;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: this.getDefaultMessage(context),
        data: data === undefined ? null : data,
        timestamp: new Date().toISOString(),
        endpoint,
      })),
    );
  }

  private getDefaultMessage(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    const messageMap: Record<string, string> = {
      'GET /users/profile': 'Profile retrieved successfully',
      'POST /auth/login': 'Login successful',
      'POST /auth/register': 'Registration successful',
    };

    const key = `${method} ${url}`;
    return messageMap[key] || 'Operation completed successfully';
  }
}
