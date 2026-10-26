import {
  IsString,
  IsOptional,
  IsISO8601,
  IsInt,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketTierDto } from './ticket-tier.dto';

export class CreateEventDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  description: string;

  /**
   * Category CODE (e.g. "FESTIVAL"), not a UUID.
   * The service resolves it to the real categoryId internally.
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryId?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsString()
  @MaxLength(200)
  venueName: string;

  @IsString()
  address: string;

  @IsString()
  @MaxLength(100)
  county: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketTierDto)
  ticketTiers: TicketTierDto[];
}
