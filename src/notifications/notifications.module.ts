import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Habit } from '../database/entities/habit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Habit])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
