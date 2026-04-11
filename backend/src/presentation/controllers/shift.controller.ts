import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { ShiftService } from '../../application/services/shift.service';
import {
  ClockInDto,
  ClockOutDto,
  ShiftHistoryDto,
  ShiftResponseDto,
  ShiftHistoryResponseDto,
} from '../../application/dto/shift.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ShiftStatus } from '../../domain/entities/shift.entity';

/**
 * Shift controller
 * Handles shift clock-in, clock-out, and history operations
 */
@ApiTags('shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  /**
   * Clock in endpoint
   * Creates a new shift for the authenticated user
   */
  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clock in',
    description:
      'Start a new shift for the authenticated user. User cannot clock in if they have an active or pending shift.',
  })
  @ApiBody({
    type: ClockInDto,
    description:
      'No request body required - user ID is extracted from JWT token',
  })
  @ApiResponse({
    status: 201,
    description: 'Shift successfully created',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User has an active or pending shift',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or inactive',
  })
  async clockIn(@CurrentUser() user: any): Promise<ShiftResponseDto> {
    try {
      const shift = await this.shiftService.clockIn(user.id);
      return shift as ShiftResponseDto;
    } catch (error) {
      throw new BadRequestException({
        message: 'Clock in failed',
        error: error.message,
      });
    }
  }

  /**
   * Clock out endpoint
   * Ends the current active shift for the authenticated user
   */
  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clock out',
    description:
      'End the current active shift for the authenticated user. Marks the shift as completed.',
  })
  @ApiBody({
    type: ClockOutDto,
    description:
      'No request body required - user ID is extracted from JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift successfully completed',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No active shift found to clock out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or inactive, or no active shift found',
  })
  async clockOut(@CurrentUser() user: any): Promise<ShiftResponseDto> {
    try {
      const shift = await this.shiftService.clockOut(user.id);
      return shift as ShiftResponseDto;
    } catch (error) {
      throw new BadRequestException({
        message: 'Clock out failed',
        error: error.message,
      });
    }
  }

  /**
   * Get current shift endpoint
   * Returns the current active or pending shift for the authenticated user
   */
  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current shift',
    description:
      'Get the current active or pending shift for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current shift retrieved successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getCurrentShift(
    @CurrentUser() user: any,
  ): Promise<ShiftResponseDto | null> {
    try {
      const shift = await this.shiftService.getCurrentShift(user.id);
      return shift as ShiftResponseDto;
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to get current shift',
        error: error.message,
      });
    }
  }

  /**
   * Get shift history endpoint
   * Returns paginated shift history for the authenticated user with optional filters
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get shift history',
    description:
      'Get paginated shift history for the authenticated user with optional date range and status filters.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of shifts to return',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of shifts to skip',
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (YYYY-MM-DD)',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (YYYY-MM-DD)',
    type: String,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Shift status for filtering',
    enum: ['pending', 'active', 'completed'],
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift history retrieved successfully',
    type: ShiftHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getShiftHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ): Promise<ShiftHistoryResponseDto> {
    try {
      // Check if any filters are provided
      const hasFilters = startDate || endDate || status;

      if (hasFilters) {
        // Use filtered method
        const filters = {
          startDate,
          endDate,
          status: status as ShiftStatus | undefined,
        };

        const result = await this.shiftService.getShiftHistoryWithFilters(
          user.id,
          filters,
          limit || 10,
          offset || 0,
        );
        return result as ShiftHistoryResponseDto;
      } else {
        // Use original method for backward compatibility
        const result = await this.shiftService.getShiftHistory(
          user.id,
          limit || 10,
          offset || 0,
        );
        return result as ShiftHistoryResponseDto;
      }
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to get shift history',
        error: error.message,
      });
    }
  }

  /**
   * Get shift history for specific user (admin endpoint)
   * Returns paginated shift history for a specific user with optional filters
   */
  @Get('history/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get shift history for specific user',
    description:
      'Get paginated shift history for a specific user with optional date range and status filters (admin only).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get history for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of shifts to return',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of shifts to skip',
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (YYYY-MM-DD)',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (YYYY-MM-DD)',
    type: String,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Shift status for filtering',
    enum: ['pending', 'active', 'completed'],
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift history retrieved successfully',
    type: ShiftHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getShiftHistoryForUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ): Promise<ShiftHistoryResponseDto> {
    try {
      // Check if any filters are provided
      const hasFilters = startDate || endDate || status;

      if (hasFilters) {
        // Use filtered method
        const filters = {
          startDate,
          endDate,
          status: status as ShiftStatus | undefined,
        };

        const result = await this.shiftService.getShiftHistoryWithFilters(
          userId,
          filters,
          limit || 10,
          offset || 0,
        );
        return result as ShiftHistoryResponseDto;
      } else {
        // Use original method for backward compatibility
        const result = await this.shiftService.getShiftHistory(
          userId,
          limit || 10,
          offset || 0,
        );
        return result as ShiftHistoryResponseDto;
      }
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to get shift history',
        error: error.message,
      });
    }
  }
}
