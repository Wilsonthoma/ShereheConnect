import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ============================================
  // Resolve the uploads directory robustly
  // ============================================
  // Try several candidate paths, use the first one that exists.
  // This works regardless of whether the app runs from src/ or dist/.
  const candidates = [
    join(process.cwd(), 'uploads'),                 // when run from apps/api
    join(__dirname, '..', 'uploads'),               // when built to dist/
    join(__dirname, '..', '..', 'uploads'),         // when built nested
  ];
  const uploadsDir = candidates.find((p) => existsSync(p)) ?? candidates[0];

  // Ensure the folder exists so Multer doesn't throw on first upload
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  console.log('📁 Static uploads served from:', uploadsDir);

  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

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
