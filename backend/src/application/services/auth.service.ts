import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  IAuthService,
  LoginData,
  RegisterData,
  AuthResult,
} from '../../domain/services/auth.service.interface';
import { ChangePasswordDto } from '../dto/profile.dto';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { User, UserWithPassword } from '../../domain/entities/user.entity';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly jwtService: JwtService,
    private readonly userProfileService: UserProfileService,
  ) {}

  async login(loginData: LoginData): Promise<AuthResult> {
    const userWithPwd = await this.userRepository.findByRutWithPassword(
      loginData.rut,
    );

    if (!userWithPwd || !userWithPwd.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      loginData.password,
      userWithPwd.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(userWithPwd);
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      userWithPwd.id,
    );

    if (!userWithRoles) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      user: userWithRoles,
      token,
    };
  }

  async register(registerData: RegisterData): Promise<AuthResult> {
    const existingUserByRut = await this.userRepository.findByRut(
      registerData.rut,
    );

    if (existingUserByRut) {
      throw new ConflictException('User with this RUT already exists');
    }

    const existingUserByEmail = await this.userRepository.findByEmail(
      registerData.email,
    );

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(registerData.password);

    const user = await this.userRepository.create({
      rut: registerData.rut,
      email: registerData.email,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      password: hashedPassword,
    });

    // Asignar automáticamente el rol "user" al usuario registrado
    const userRole = await this.roleRepository.findByName('user');
    if (userRole) {
      await this.roleRepository.assignRoleToUser(user.id, userRole.id);
    }

    const token = this.generateToken(user);
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      user.id,
    );

    if (!userWithRoles) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      user: userWithRoles,
      token,
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const user = await this.userRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    // Need the password hash — use the email-based lookup via findById then re-fetch with password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userWithPwd = await this.userRepository.findByEmailWithPassword(
      user.email,
    );
    if (!userWithPwd) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(
      changePasswordDto.currentPassword,
      userWithPwd.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await this.comparePassword(
      changePasswordDto.newPassword,
      userWithPwd.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(
      changePasswordDto.newPassword,
    );

    // Update password
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private generateToken(user: UserWithPassword | User): string {
    const payload = {
      sub: user.id,
      rut: user.rut,
      email: user.email,
      // Multi-tenant claim. Until the organizations table lands every user
      // gets the placeholder default; once it does, swap this for the user's
      // active organization id from user_organizations.
      organizationId: 'gatekeeper-default',
    };

    return this.jwtService.sign(payload);
  }

  // Password is no longer on the public User type; this method is no longer needed.
}
