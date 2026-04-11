import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe configuration
  // This ensures all incoming requests are validated at the presentation layer
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
      errorHttpStatusCode: 400, // Return 400 Bad Request for validation errors
      disableErrorMessages: false, // Include detailed error messages
    }),
  );

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Health check endpoint
  app
    .getHttpAdapter()
    .getInstance()
    .get('/health', (_req, res) => res.status(200).send({ ok: true }));

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8000'],
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
