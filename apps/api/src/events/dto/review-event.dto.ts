import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUESTED_CHANGES = 'REQUESTED_CHANGES',
}

export class ReviewEventDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
