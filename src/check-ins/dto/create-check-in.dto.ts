import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateCheckInDto {
  @IsUUID()
  habitId!: string;

  @IsOptional()
  @IsDateString()
  checkDate?: string;
}
