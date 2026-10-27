import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class UpdateKycDto {
  @IsEnum(KycStatus)
  kycStatus: KycStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
