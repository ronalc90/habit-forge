import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../database/entities/habit.entity';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  async sendPushNotification(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[MOCK] Push notification to user ${payload.userId}: ${payload.title} - ${payload.body}`,
    );
  }

  async sendReminderForHabit(userId: string, habitName: string): Promise<void> {
    await this.sendPushNotification({
      userId,
      title: 'Habit Reminder',
      body: `Time to complete your habit: ${habitName}`,
      data: { type: 'habit_reminder' },
    });
  }

  async sendStreakMilestone(
    userId: string,
    habitName: string,
    streakCount: number,
  ): Promise<void> {
    await this.sendPushNotification({
      userId,
      title: 'Streak Milestone!',
      body: `You've completed ${streakCount} days of ${habitName}! Keep it going!`,
      data: { type: 'streak_milestone', count: String(streakCount) },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders(): Promise<void> {
    this.logger.log('[MOCK] Sending daily reminders...');

    const activeHabits = await this.habitRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });

    for (const habit of activeHabits) {
      await this.sendReminderForHabit(habit.userId, habit.name);
    }

    this.logger.log(`[MOCK] Sent ${activeHabits.length} daily reminders`);
  }
}
