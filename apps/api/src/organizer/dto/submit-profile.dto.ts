import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizerType } from '@prisma/client';

// Kenyan KRA PIN:
//   Individual: A012345678K  (letter + 9 digits + letter)
//   Business:   P051234567M  (P + letter + 9 digits + letter)
// Case-insensitive input, normalized to uppercase server-side.
const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/i;

// Kenyan mobile numbers: +254XXXXXXXXX or 07XXXXXXXX, 01XXXXXXXX, 2547..., 2541...
const KENYAN_PHONE_REGEX =
  /^(?:\+?254|0)(7\d{8}|1\d{8})$/;

export const KYC_DOC_TYPES = ['BUSINESS_PERMIT', 'NATIONAL_ID', 'OTHER'] as const;
export type KycDocType = (typeof KYC_DOC_TYPES)[number];

// Documents that must be submitted as uploads
export const REQUIRED_DOCS: KycDocType[] = ['BUSINESS_PERMIT', 'NATIONAL_ID'];

export class KycDocumentDto {
  @IsIn(KYC_DOC_TYPES as unknown as string[])
  type!: KycDocType;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsString()
  @MaxLength(255)
  fileName!: string;
}

export class SubmitProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Matches(/\S/, { message: 'businessName cannot be only whitespace' })
  businessName!: string;

  @IsEnum(OrganizerType)
  organizerType!: OrganizerType;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  county!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  // Kenyan phone validation
  @IsString()
  @Matches(KENYAN_PHONE_REGEX, {
    message:
      'phone must be a valid Kenyan number (e.g. 0712345678, +254712345678)',
  })
  phone!: string;

  // KRA PIN — required, Kenyan format
  @IsString()
  @Matches(KRA_PIN_REGEX, {
    message:
      'kraPin must be a valid Kenyan KRA PIN (e.g. A012345678K or P051234567M)',
  })
  kraPin!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KycDocumentDto)
  kycDocuments!: KycDocumentDto[];
}
