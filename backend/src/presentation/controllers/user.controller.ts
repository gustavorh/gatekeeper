import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserWithRolesResponse } from '../../application/dto/response.dto';
import {
  UpdateProfileDto,
  ProfileUpdateResponse,
} from '../../application/dto/profile.dto';
import { User } from '../../domain/entities/user.entity';
import { UserProfileService } from '../../application/services/user-profile.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
)
export class UserController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieve the current user profile with roles and permissions. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserWithRolesResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error - User not found or database error',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserWithRolesResponse> {
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      user.id,
    );

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    return userWithRoles;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Update the current user profile information. Email, first name, and last name can be updated. RUT cannot be changed. Requires JWT authentication.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'User profile update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileUpdateResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or validation error',
  })
  @ApiConflictResponse({
    description: 'Email is already in use by another user',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error - User not found or database error',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileUpdateResponse> {
    return await this.userProfileService.updateProfile(
      user.id,
      updateProfileDto,
    );
  }
}
