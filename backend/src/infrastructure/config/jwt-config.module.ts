import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Shared JWT configuration module.
 * Import this module instead of inline JwtModule.register() to avoid
 * duplicating the secret and reading process.env directly.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: (config: ConfigService): Record<string, any> => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
