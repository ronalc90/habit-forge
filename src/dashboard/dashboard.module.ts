import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Habit } from '../database/entities/habit.entity';
import { CheckIn } from '../database/entities/check-in.entity';
import { Streak } from '../database/entities/streak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, CheckIn, Streak])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
