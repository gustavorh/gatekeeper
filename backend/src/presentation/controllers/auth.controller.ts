import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RegisterDto } from '../../application/dto/auth.dto';
import { ChangePasswordDto } from '../../application/dto/profile.dto';
import { AuthResponse } from '../../application/dto/response.dto';
import type { AuthResult } from '../../domain/services/auth.service.interface';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import type { JwtPayload } from '../../application/types/jwt-payload';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE_FALLBACK,
  GK_AUTH_SIGNAL_COOKIE,
} from '../../application/constants/auth-cookies';

/**
 * Authentication controller
 * Handles user login and registration with proper validation at presentation layer
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie(GK_AUTH_SIGNAL_COOKIE, '1', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(AUTH_TOKEN_COOKIE, { path: '/' });
    if (AUTH_TOKEN_COOKIE !== AUTH_TOKEN_COOKIE_FALLBACK) {
      res.clearCookie(AUTH_TOKEN_COOKIE_FALLBACK, { path: '/' });
    }
    res.clearCookie(GK_AUTH_SIGNAL_COOKIE, { path: '/' });
  }

  /**
   * User login endpoint
   * Validates input using LoginDto at presentation layer
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts — rate limit exceeded',
  })
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const auth = await this.authService.login(loginDto);
    this.setAuthCookies(res, auth.token);
    return auth;
  }

  /**
   * User registration endpoint
   * Validates input using RegisterDto at presentation layer
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts — rate limit exceeded',
  })
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
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const auth = await this.authService.register(registerDto);
    this.setAuthCookies(res, auth.token);
    return auth;
  }

  /**
   * Change password endpoint
   * Allows authenticated users to change their password
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
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
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description:
      'Clears the auth_token and gk-auth cookies so subsequent requests are unauthenticated.',
  })
  @ApiResponse({ status: 200, description: 'Session cleared' })
  logout(@Res({ passthrough: true }) res: Response): {
    success: boolean;
    message: string;
  } {
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out' };
  }
}
