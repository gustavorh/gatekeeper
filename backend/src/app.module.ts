import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './application/modules/auth.module';
import { AdminModule } from './application/modules/admin.module';
import { ShiftModule } from './application/modules/shift.module';
import { HealthModule } from './application/modules/health.module';
import databaseConfig from './infrastructure/config/database.config';
import { envValidationSchema } from './infrastructure/config/env.validation';
import { ResponseInterceptor } from './presentation/interceptors/response.interceptor';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
        {
          name: 'auth',
          ttl: config.get<number>('THROTTLE_AUTH_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_AUTH_LIMIT', 5),
        },
      ],
    }),
    AuthModule,
    AdminModule,
    ShiftModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
