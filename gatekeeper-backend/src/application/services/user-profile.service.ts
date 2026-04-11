import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { User } from '../../domain/entities/user.entity';
import {
  UserWithRolesResponse,
  RoleResponse,
  PermissionResponse,
} from '../dto/response.dto';
import { UpdateProfileDto, ProfileUpdateResponse } from '../dto/profile.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async getUserWithRoles(
    userId: string,
  ): Promise<UserWithRolesResponse | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    // Obtener roles del usuario
    const userRoles = await this.roleRepository.findUserRoles(userId);

    // Para cada rol, obtener sus permisos
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

    return {
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
