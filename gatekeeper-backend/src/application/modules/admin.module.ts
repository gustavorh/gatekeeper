import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infrastructure/database/database.module';
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
  imports: [
    DatabaseModule,
    AuthModule,
    ShiftModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminAuthGuard,
    JwtAuthGuard,
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
  exports: [AdminService, AdminAuthGuard],
})
export class AdminModule {}
