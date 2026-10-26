import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsISO8601,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class TicketTierDto {
  /**
   * Optional — present only when updating an existing tier.
   * The edit form sends back the id of tiers already in the DB
   * so they can be updated in place instead of being deleted/recreated.
   */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceKes: number;

  @IsInt()
  @Min(1)
  quantityTotal: number;

  @IsOptional()
  @IsISO8601()
  salesStartAt?: string;

  @IsOptional()
  @IsISO8601()
  salesEndAt?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
