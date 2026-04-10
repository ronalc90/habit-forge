import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from '../database/entities/streak.entity';
import { CheckIn } from '../database/entities/check-in.entity';

@Injectable()
export class StreaksService {
  constructor(
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
  ) {}

  async getStreak(habitId: string): Promise<Streak> {
    const streak = await this.streakRepository.findOne({
      where: { habitId },
    });

    if (!streak) {
      throw new NotFoundException(`Streak for habit ${habitId} not found`);
    }

    return streak;
  }

  async updateStreakOnCheckIn(habitId: string, checkDate: string): Promise<Streak> {
    let streak = await this.streakRepository.findOne({
      where: { habitId },
    });

    if (!streak) {
      streak = this.streakRepository.create({
        habitId,
        currentStreak: 0,
        bestStreak: 0,
      });
    }

    const yesterday = this.getPreviousDay(checkDate);

    if (streak.lastCheckDate === null) {
      streak.currentStreak = 1;
    } else if (streak.lastCheckDate === yesterday) {
      streak.currentStreak += 1;
    } else if (streak.lastCheckDate === checkDate) {
      return streak;
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.bestStreak) {
      streak.bestStreak = streak.currentStreak;
    }

    streak.lastCheckDate = checkDate;

    return this.streakRepository.save(streak);
  }

  async recalculateStreak(habitId: string): Promise<Streak> {
    const streak = await this.streakRepository.findOne({
      where: { habitId },
    });

    if (!streak) {
      throw new NotFoundException(`Streak for habit ${habitId} not found`);
    }

    const checkIns = await this.checkInRepository.find({
      where: { habitId },
      order: { checkDate: 'DESC' },
    });

    if (checkIns.length === 0) {
      streak.currentStreak = 0;
      streak.lastCheckDate = null;
      return this.streakRepository.save(streak);
    }

    const sortedDates = checkIns
      .map((c) => c.checkDate)
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 1;
    let bestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const expectedPrevious = this.getPreviousDay(sortedDates[i - 1]);
      if (sortedDates[i] === expectedPrevious) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }

    const today = this.getTodayDateString();
    const yesterday = this.getPreviousDay(today);
    const mostRecentDate = sortedDates[0];

    if (mostRecentDate === today || mostRecentDate === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const expectedPrevious = this.getPreviousDay(sortedDates[i - 1]);
        if (sortedDates[i] === expectedPrevious) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    streak.currentStreak = currentStreak;
    streak.bestStreak = Math.max(bestStreak, streak.bestStreak);
    streak.lastCheckDate = sortedDates[0];

    return this.streakRepository.save(streak);
  }

  async getStreaksForUser(habitIds: string[]): Promise<Streak[]> {
    if (habitIds.length === 0) return [];

    return this.streakRepository
      .createQueryBuilder('streak')
      .where('streak.habitId IN (:...habitIds)', { habitIds })
      .getMany();
  }

  private getPreviousDay(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
