import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RegisterDto } from '../../application/dto/auth.dto';
import { ChangePasswordDto } from '../../application/dto/profile.dto';
import { AuthResponse } from '../../application/dto/response.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { User } from '../../domain/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

/**
 * Authentication controller
 * Handles user login and registration with proper validation at presentation layer
 */
@ApiTags('auth')
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login endpoint
   * Validates input using LoginDto at presentation layer
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate a user with RUT and password. Returns user information and JWT token.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  /**
   * User registration endpoint
   * Validates input using RegisterDto at presentation layer
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description:
      'Register a new user with RUT, email, password, and personal information. Automatically assigns the "user" role.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this RUT or email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  /**
   * Change password endpoint
   * Allows authenticated users to change their password
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Change the authenticated user password. Requires current password for verification and a new password with minimum 6 characters.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data with current and new password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid data, validation error, or incorrect current password',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.authService.changePassword(user.id, changePasswordDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Password change failed',
        error: error.message,
      });
    }
  }
}
