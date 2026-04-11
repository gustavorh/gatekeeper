import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './application/modules/auth.module';
import { AdminModule } from './application/modules/admin.module';
import { ShiftModule } from './application/modules/shift.module';
import databaseConfig from './infrastructure/config/database.config';
import { ResponseInterceptor } from './presentation/interceptors/response.interceptor';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    AuthModule,
    AdminModule,
    ShiftModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
