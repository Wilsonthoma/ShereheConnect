import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class BookingFilterDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsUUID()
  eventId?: string;
}