import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8000'].filter(
      (o): o is string => Boolean(o),
    ),
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Gatekeeper API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📝 API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
