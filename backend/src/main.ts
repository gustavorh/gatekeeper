import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 400,
      disableErrorMessages: false,
    }),
  );

  const configService = app.get(ConfigService);

  app.use(cookieParser());

  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"],
              styleSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'data:'],
              frameSrc: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gatekeeper API')
    .setDescription(
      'RESTful API for the Gatekeeper application. This API provides authentication, user management, and role-based access control functionality.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints for user login and registration')
    .addTag('users', 'User management endpoints for profile and user data')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for references
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Gatekeeper API Documentation',
  });

  // Limit request body size to prevent payload-based DoS
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log({ port }, `Application listening on port ${port}`);
  logger.log(`Swagger docs at /api/docs`);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
