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

  // ============================================
  // CORS Configuration for Local & Vercel
  // ============================================
  app.enableCors({
    // Allow localhost and any Vercel deployment URL
    origin: [
      'http://localhost:3000',
      process.env.WEB_URL,
      /\.vercel\.app$/, // Regex to allow all vercel.app domains
    ].filter(Boolean), // Remove undefined values
    credentials: true,
  });

  // ============================================
  // Port Binding (Vercel injects PORT, fallback to 4000)
  // ============================================
  const port = process.env.PORT ?? 4000;
  
  await app.listen(port);
  
  console.log(`🚀 Application is running on port: ${port}`);
}
bootstrap();