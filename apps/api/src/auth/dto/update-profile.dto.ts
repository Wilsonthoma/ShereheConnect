import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?254\d{9}$|^0\d{9}$/, {
    message: 'Phone must be a valid Kenyan number',
  })
  phone?: string;
}
