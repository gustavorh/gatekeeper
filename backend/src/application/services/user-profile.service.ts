import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { ICacheService } from '../interfaces/cache.service.interface';
import { CACHE_SERVICE } from '../interfaces/cache.service.interface';
import { UserWithRolesResponse, RoleResponse } from '../dto/response.dto';
import { UpdateProfileDto, ProfileUpdateResponse } from '../dto/profile.dto';

const userWithRolesKey = (userId: string) => `user:${userId}:withRoles`;
export const USER_WITH_ROLES_CACHE = {
  key: userWithRolesKey,
  ttl: 5 * 60 * 1000,
};

@Injectable()
export class UserProfileService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {}

  async getUserWithRoles(
    userId: string,
  ): Promise<UserWithRolesResponse | null> {
    const cached = await this.cache.get<UserWithRolesResponse>(
      userWithRolesKey(userId),
    );
    if (cached) return cached;

    // C5: single JOIN query instead of N+1
    const result =
      await this.userRepository.findByIdWithRolesAndPermissions(userId);
    if (!result) return null;

    const { user, roles } = result;

    const rolesWithPermissions: RoleResponse[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions,
    }));

    const response: UserWithRolesResponse = {
      id: user.id,
      rut: user.rut,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: rolesWithPermissions,
    };

    await this.cache.set(
      userWithRolesKey(userId),
      response,
      USER_WITH_ROLES_CACHE.ttl,
    );

    return response;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.cache.del(userWithRolesKey(userId));
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileUpdateResponse> {
    // Verify user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already in use
    if (
      updateProfileDto.email &&
      updateProfileDto.email !== existingUser.email
    ) {
      const emailExists = await this.userRepository.existsByEmail(
        updateProfileDto.email,
      );
      if (emailExists) {
        throw new ConflictException('Email is already in use by another user');
      }
    }

    // Update user profile
    const updatedUser = await this.userRepository.update(
      userId,
      updateProfileDto,
    );

    await this.invalidateUserCache(userId);

    return {
      id: updatedUser.id,
      rut: updatedUser.rut,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
