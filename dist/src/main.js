"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('FreshLink API')
        .setDescription('AI-powered marketplace connecting food/beverage buyers with providers.\n\n' +
        '**Auth:** Use `POST /api/v1/auth/login` to get an `accessToken`, then click ' +
        '"Authorize" and paste it as a Bearer token.')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'access-token')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`\n🚀  FreshLink API  →  http://localhost:${port}/api/v1`);
    console.log(`📚  Swagger docs   →  http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map