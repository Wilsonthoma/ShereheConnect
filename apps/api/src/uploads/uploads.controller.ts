import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { unlink } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const IMAGE_MIMES = /^image\/(jpeg|png|webp|gif)$/;
const PDF_MIME = 'application/pdf';
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|pdf)$/i;

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // Max 10MB absolute limit
      },
      fileFilter: (req, file, callback) => {
        // Check both MIME type AND file extension for maximum security
        const isValidMime = IMAGE_MIMES.test(file.mimetype) || file.mimetype === PDF_MIME;
        const isValidExt = ALLOWED_EXTENSIONS.test(file.originalname);

        if (!isValidMime || !isValidExt) {
          return callback(
            new BadRequestException(
              'Only JPEG, PNG, WebP, GIF images or PDF documents are allowed.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const isPdf = file.mimetype === PDF_MIME;
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

    // If the file is too large for its type, delete it from the disk and throw an error
    if (file.size > maxSize) {
      unlink(file.path, (err) => {
        if (err) console.error('Failed to delete oversized file:', err);
      });
      throw new BadRequestException(
        isPdf ? 'PDF must be under 10MB.' : 'Image must be under 5MB.',
      );
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}