import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { clear } from 'console';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Uploads setup
  const candidates = [
    join(process.cwd(), 'uploads'),
    join(__dirname, '..', 'uploads'),
    join(__dirname, '..', '..', 'uploads'),
  ];
  const uploadsDir = candidates.find((p) => existsSync(p)) ?? candidates[0];

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

  // Bulletproof CORS configuration
  app.enableCors({
    origin: true, 
    credentials: true,
  });

  // Dynamic Port
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Application is running on port: ${port}`);
}
bootstrap();