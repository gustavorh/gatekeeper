import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
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
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async getUserWithRoles(
    userId: string,
  ): Promise<UserWithRolesResponse | null> {
    const cached = await this.cache.get<UserWithRolesResponse>(
      userWithRolesKey(userId),
    );
    if (cached) return cached;

    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    const userRoles = await this.roleRepository.findUserRoles(userId);

    const rolesWithPermissions: RoleResponse[] = await Promise.all(
      userRoles.map(async (role) => {
        const permissions =
          await this.permissionRepository.findPermissionsByRole(role.id);

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: permissions.map((permission) => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            isActive: permission.isActive,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
          })),
        };
      }),
    );

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
