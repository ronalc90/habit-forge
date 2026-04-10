import { IsArray, ValidateNested, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class BatchCheckInItem {
  @IsUUID()
  habitId!: string;
}

export class BatchCheckInDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCheckInItem)
  habits!: BatchCheckInItem[];

  @IsOptional()
  @IsDateString()
  checkDate?: string;
}
