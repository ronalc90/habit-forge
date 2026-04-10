import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { HabitFrequency } from '../../database/entities/habit.entity';

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty({ message: 'Habit name must not be empty' })
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'preferredTime must be in HH:mm format',
  })
  preferredTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  targetDaysPerWeek?: number;
}
