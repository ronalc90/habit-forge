import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { Habit } from '../database/entities/habit.entity';
import { Streak } from '../database/entities/streak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, Streak])],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}
