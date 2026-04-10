import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Habit } from '../database/entities/habit.entity';
import { CheckIn } from '../database/entities/check-in.entity';
import { Streak } from '../database/entities/streak.entity';
import { DashboardPeriod } from './dto/dashboard-query.dto';

export interface TodaySummary {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  currentStreaks: Array<{
    habitId: string;
    habitName: string;
    currentStreak: number;
    bestStreak: number;
    isCompletedToday: boolean;
  }>;
}

export interface CalendarData {
  dates: Array<{
    date: string;
    completedCount: number;
    totalHabits: number;
    completionRate: number;
  }>;
}

export interface PeriodStats {
  period: string;
  totalCheckIns: number;
  totalPossible: number;
  consistencyRate: number;
  habitBreakdown: Array<{
    habitId: string;
    habitName: string;
    checkIns: number;
    possible: number;
    rate: number;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
  ) {}

  async getTodaySummary(userId: string): Promise<TodaySummary> {
    const today = this.getTodayDateString();

    const habits = await this.habitRepository.find({
      where: { userId, isActive: true },
      relations: ['streak'],
    });

    const todayCheckIns = await this.checkInRepository.find({
      where: { userId, checkDate: today },
    });

    const checkedInHabitIds = new Set(todayCheckIns.map((c) => c.habitId));

    const currentStreaks = habits.map((habit) => ({
      habitId: habit.id,
      habitName: habit.name,
      currentStreak: habit.streak?.currentStreak ?? 0,
      bestStreak: habit.streak?.bestStreak ?? 0,
      isCompletedToday: checkedInHabitIds.has(habit.id),
    }));

    const totalHabits = habits.length;
    const completedToday = checkedInHabitIds.size;
    const completionRate = totalHabits > 0
      ? Math.round((completedToday / totalHabits) * 100)
      : 0;

    return {
      totalHabits,
      completedToday,
      completionRate,
      currentStreaks,
    };
  }

  async getCalendarData(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<CalendarData> {
    const habits = await this.habitRepository.find({
      where: { userId, isActive: true },
    });

    const totalHabits = habits.length;

    const checkIns = await this.checkInRepository.find({
      where: {
        userId,
        checkDate: Between(startDate, endDate),
      },
    });

    const dateMap = new Map<string, number>();
    for (const checkIn of checkIns) {
      const count = dateMap.get(checkIn.checkDate) || 0;
      dateMap.set(checkIn.checkDate, count + 1);
    }

    const dates: CalendarData['dates'] = [];
    const current = new Date(startDate + 'T12:00:00Z');
    const end = new Date(endDate + 'T12:00:00Z');

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const completedCount = dateMap.get(dateStr) || 0;

      dates.push({
        date: dateStr,
        completedCount,
        totalHabits,
        completionRate: totalHabits > 0
          ? Math.round((completedCount / totalHabits) * 100)
          : 0,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return { dates };
  }

  async getPeriodStats(
    userId: string,
    period: DashboardPeriod = DashboardPeriod.WEEK,
    referenceDate?: string,
  ): Promise<PeriodStats> {
    const ref = referenceDate || this.getTodayDateString();
    const { startDate, endDate } = this.getPeriodRange(ref, period);

    const habits = await this.habitRepository.find({
      where: { userId, isActive: true },
    });

    const checkIns = await this.checkInRepository.find({
      where: {
        userId,
        checkDate: Between(startDate, endDate),
      },
    });

    const daysInPeriod = this.countDays(startDate, endDate);
    const totalPossible = habits.length * daysInPeriod;

    const habitCheckInMap = new Map<string, number>();
    for (const checkIn of checkIns) {
      const count = habitCheckInMap.get(checkIn.habitId) || 0;
      habitCheckInMap.set(checkIn.habitId, count + 1);
    }

    const habitBreakdown = habits.map((habit) => {
      const checkInCount = habitCheckInMap.get(habit.id) || 0;
      const targetDays = Math.min(habit.targetDaysPerWeek, daysInPeriod);
      const possible = period === DashboardPeriod.WEEK
        ? targetDays
        : Math.ceil((habit.targetDaysPerWeek / 7) * daysInPeriod);

      return {
        habitId: habit.id,
        habitName: habit.name,
        checkIns: checkInCount,
        possible,
        rate: possible > 0 ? Math.round((checkInCount / possible) * 100) : 0,
      };
    });

    const totalCheckIns = checkIns.length;
    const consistencyRate = totalPossible > 0
      ? Math.round((totalCheckIns / totalPossible) * 100)
      : 0;

    return {
      period: `${startDate} to ${endDate}`,
      totalCheckIns,
      totalPossible,
      consistencyRate,
      habitBreakdown,
    };
  }

  private getPeriodRange(
    referenceDate: string,
    period: DashboardPeriod,
  ): { startDate: string; endDate: string } {
    const ref = new Date(referenceDate + 'T12:00:00Z');

    if (period === DashboardPeriod.WEEK) {
      const dayOfWeek = ref.getUTCDay();
      const monday = new Date(ref);
      monday.setUTCDate(ref.getUTCDate() - ((dayOfWeek + 6) % 7));

      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);

      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0],
      };
    }

    const firstDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
    const lastDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));

    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
  }

  private countDays(startDate: string, endDate: string): number {
    const start = new Date(startDate + 'T12:00:00Z');
    const end = new Date(endDate + 'T12:00:00Z');
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
