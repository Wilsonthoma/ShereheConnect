import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { PaymentMethodType } from '@prisma/client';

export class AddPaymentMethodDto {
  @IsEnum(PaymentMethodType)
  methodType!: PaymentMethodType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shortcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phoneNumber must be 7-15 digits, optional + prefix',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayLabel?: string;
}
