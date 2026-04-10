import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreaksService } from './streaks.service';
import { Streak } from '../database/entities/streak.entity';
import { CheckIn } from '../database/entities/check-in.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Streak, CheckIn])],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
