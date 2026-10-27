import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class ReviewKycDto {
  @IsEnum(KycStatus)
  kycStatus!: KycStatus;

  @ValidateIf((o) => o.kycStatus === 'SUSPENDED' || o.kycStatus === 'REJECTED' || o.kycStatus === 'NEEDS_REVISION')
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
