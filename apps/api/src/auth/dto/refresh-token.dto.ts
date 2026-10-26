import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class LogoutAllDto {
  @IsOptional()
  @IsBoolean()
  includeCurrent?: boolean;
}
