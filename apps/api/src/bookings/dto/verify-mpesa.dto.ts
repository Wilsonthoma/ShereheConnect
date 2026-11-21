import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyMpesaDto {
  @IsString()
  @IsNotEmpty()
  smsText: string;
}