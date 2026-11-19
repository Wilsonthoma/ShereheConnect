import { IsNotEmpty, IsString, Matches, IsIn } from 'class-validator';

export class InitiateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['STARTER', 'PRO', 'BUSINESS'], {
    message: 'Plan code must be STARTER, PRO, or BUSINESS for paid upgrades.',
  })
  planCode: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+?254|0)(7|1)\d{8}$/, {
    message: 'Provide a valid Kenyan M-Pesa phone number (e.g., 0712345678 or 254712345678).',
  })
  phoneNumber: string;
}