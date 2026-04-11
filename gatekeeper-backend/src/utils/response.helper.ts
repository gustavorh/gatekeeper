import {
  ApiResponse,
  PaginatedResponse,
} from '../application/dto/response.dto';

export class ResponseHelper {
  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static paginated<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully',
    path?: string,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static error(message: string, error: string, path?: string, details?: any) {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
      details,
    };
  }
}
