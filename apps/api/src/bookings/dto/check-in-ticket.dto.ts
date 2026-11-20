import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckInTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ticketCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  qrToken?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}