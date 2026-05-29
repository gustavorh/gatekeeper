import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtConfigModule } from '../../infrastructure/config/jwt-config.module';
import { AdminController } from '../../presentation/controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { AdminAuthGuard } from '../../presentation/middleware/admin-auth.guard';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';
import { RolesGuard } from '../../presentation/guards/roles.guard';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';
import { NestCacheService } from '../../infrastructure/cache/nest-cache.service';
import { CACHE_SERVICE } from '../interfaces/cache.service.interface';
import { AuthModule } from './auth.module';
import { ShiftModule } from './shift.module';

@Module({
  imports: [DatabaseModule, JwtConfigModule, AuthModule, ShiftModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtAuthGuard,
    AdminAuthGuard,
    RolesGuard,
    UserRepository,
    RoleRepository,
    PermissionRepository,
    NestCacheService,
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
    {
      provide: CACHE_SERVICE,
      useClass: NestCacheService,
    },
  ],
  exports: [AdminService, JwtAuthGuard, AdminAuthGuard, RolesGuard],
})
export class AdminModule {}
