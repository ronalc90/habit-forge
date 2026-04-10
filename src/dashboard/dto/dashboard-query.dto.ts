import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum DashboardPeriod {
  WEEK = 'week',
  MONTH = 'month',
}

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod;
}
