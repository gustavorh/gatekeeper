import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtConfigModule } from '../../infrastructure/config/jwt-config.module';
import { ShiftService } from '../services/shift.service';
import { AnalyticsService } from '../services/analytics.service';
import { ShiftRepository } from '../../infrastructure/repositories/shift.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { ShiftController } from '../../presentation/controllers/shift.controller';
import { AnalyticsController } from '../../presentation/controllers/analytics.controller';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';
import { RolesGuard } from '../../presentation/guards/roles.guard';
import { OwnershipGuard } from '../../presentation/guards/ownership.guard';
import { ShiftAuditListener } from '../listeners/shift-audit.listener';
import { ShiftScheduleService } from '../services/shift-schedule.service';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [ShiftController, AnalyticsController],
  providers: [
    ShiftService,
    AnalyticsService,
    ShiftScheduleService,
    ShiftRepository,
    UserRepository,
    RoleRepository,
    JwtAuthGuard,
    RolesGuard,
    OwnershipGuard,
    ShiftAuditListener,
    {
      provide: 'IShiftRepository',
      useClass: ShiftRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRoleRepository',
      useClass: RoleRepository,
    },
  ],
  exports: [ShiftService, AnalyticsService, RolesGuard],
})
export class ShiftModule {}
