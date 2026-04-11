import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';
import { AuthService } from '../services/auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { UserController } from '../../presentation/controllers/user.controller';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserProfileService,
    UserRepository,
    RoleRepository,
    PermissionRepository,
    JwtAuthGuard,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRoleRepository',
      useClass: RoleRepository,
    },
    {
      provide: 'IPermissionRepository',
      useClass: PermissionRepository,
    },
  ],
  exports: [AuthService, UserProfileService, JwtAuthGuard],
})
export class AuthModule {}
