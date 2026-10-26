import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Use NestExpressApplication so we can configure static assets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ============================================
  // SERVE UPLOADED IMAGES AS STATIC FILES
  //
  // Uploads are stored at apps/api/uploads/
  // They become accessible at:
  //   http://localhost:4000/uploads/<filename>
  //
  // __dirname at runtime = apps/api/dist (when built)
  // __dirname at runtime = apps/api/src (when running via ts-node)
  // So we go up one level to reach apps/api/uploads/
  // ============================================
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();