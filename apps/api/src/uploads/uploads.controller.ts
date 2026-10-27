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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const IMAGE_MIMES = /^image\/(jpeg|png|webp|gif)$/;
const PDF_MIME = 'application/pdf';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        // Up to 10MB — images < 5MB, PDFs < 10MB (enforced below)
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!IMAGE_MIMES.test(file.mimetype) && file.mimetype !== PDF_MIME) {
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

    // Enforce 5MB for images, 10MB for PDFs
    const isPdf = file.mimetype === PDF_MIME;
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
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
