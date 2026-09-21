import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?254\d{9}$|^0\d{9}$/, {
    message: 'Phone must be a valid Kenyan number (e.g., 0712345678 or +254712345678)',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  @IsOptional()
  @IsIn(['ATTENDEE', 'ORGANIZER'], {
    message: 'Role must be either ATTENDEE or ORGANIZER',
  })
  role?: 'ATTENDEE' | 'ORGANIZER';
}
