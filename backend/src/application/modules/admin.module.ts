import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtConfigModule } from '../../infrastructure/config/jwt-config.module';
import { AdminController } from '../../presentation/controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { AdminAuthGuard } from '../../presentation/middleware/admin-auth.guard';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';
import { AuthModule } from './auth.module';
import { ShiftModule } from './shift.module';

@Module({
  imports: [DatabaseModule, JwtConfigModule, AuthModule, ShiftModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtAuthGuard,
    AdminAuthGuard,
    UserRepository,
    RoleRepository,
    PermissionRepository,
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
  exports: [AdminService, JwtAuthGuard, AdminAuthGuard],
})
export class AdminModule {}
