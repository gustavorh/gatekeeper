import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../../application/dto/response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || this.getErrorType(status);
        details = responseObj.details || null;
      } else {
        message = exception.message;
        error = this.getErrorType(status);
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      details,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorType(status: number): string {
    const errorMap: Record<number, string> = {
      400: 'BadRequest',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'NotFound',
      409: 'Conflict',
      422: 'UnprocessableEntity',
      500: 'InternalServerError',
    };

    return errorMap[status] || 'InternalServerError';
  }
}
