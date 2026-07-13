import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Raw body needed for Stripe webhook signature verification
    rawBody: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  });

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('FreshLink API')
    .setDescription(
      'AI-powered marketplace connecting food/beverage buyers with providers.\n\n' +
        '**Auth:** Use `POST /api/v1/auth/login` to get an `accessToken`, then click ' +
        '"Authorize" and paste it as a Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Health')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Providers')
    .addTag('Search')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('Reviews')
    .addTag('Subscriptions')
    .addTag('Notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀  FreshLink API  →  http://localhost:${port}/api/v1`);
  console.log(`📚  Swagger docs   →  http://localhost:${port}/api/docs\n`);
}

bootstrap();
