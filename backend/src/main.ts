import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Browsers send a bare Origin (scheme + host, no path or trailing slash), so reduce entries to that.
  const origins = config
    .get<string>('FRONTEND_URL', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => new URL(o).origin);
  Logger.log(`CORS origins: ${origins.join(', ')}`, 'Bootstrap');

  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`DocMind API listening on port ${port}`, 'Bootstrap');
}
bootstrap();
