import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsUUID()
  habitId?: string;
}
