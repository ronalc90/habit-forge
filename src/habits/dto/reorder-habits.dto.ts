import { IsArray, IsUUID } from 'class-validator';

export class ReorderHabitsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  habitIds!: string[];
}
