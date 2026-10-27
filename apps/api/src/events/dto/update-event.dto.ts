import {
  IsString, IsOptional, IsISO8601, IsInt, IsArray,
  ValidateNested, MaxLength, Min, IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketTierDto } from './ticket-tier.dto';

export class UpdateEventDto {
  @IsOptional() @IsString() @MaxLength(300)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString() @MaxLength(50)
  categoryId?: string;

  @IsOptional() @IsString()
  coverImageUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  venueName?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString() @MaxLength(100)
  county?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional() @IsISO8601()
  startsAt?: string;

  @IsOptional() @IsISO8601()
  endsAt?: string;

  @IsOptional() @IsInt() @Min(1)
  maxAttendees?: number;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  eventFeatures?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TicketTierDto)
  ticketTiers?: TicketTierDto[];
}
