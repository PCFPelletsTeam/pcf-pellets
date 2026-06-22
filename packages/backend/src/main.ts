import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const frontendOrigin = config.get<string>(
    'FRONTEND_ORIGIN',
    'http://localhost:5173',
  );

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PCF Pellets API')
    .setDescription(
      'REST API для розрахунку Product Carbon Footprint (PCF) залізорудних окатишів. ' +
        'ISO 14067 / GHG Protocol / CBAM / Catena-X CX-0029.',
    )
    .setVersion('0.1.0')
    .addTag('materials', 'Довідник матеріалів і енергоносіїв')
    .addTag('emission-factors', 'База коефіцієнтів викидів (EF)')
    .addTag('calculations', 'PCF-розрахунки')
    .addTag('reports', 'Експорт PDF / CSV / JSON CX-0029')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 PCF Pellets API запущено на http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(`📘 Swagger UI: http://localhost:${port}/api/docs`, 'Bootstrap');
  Logger.log(`🌐 CORS дозволено для: ${frontendOrigin}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Не вдалось запустити застосунок', err, 'Bootstrap');
  process.exit(1);
});
