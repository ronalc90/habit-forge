import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckIn } from '../database/entities/check-in.entity';
import { Habit } from '../database/entities/habit.entity';
import { StreaksService } from '../streaks/streaks.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { BatchCheckInDto } from './dto/batch-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    private readonly streaksService: StreaksService,
  ) {}

  async checkIn(userId: string, dto: CreateCheckInDto): Promise<CheckIn> {
    const habit = await this.habitRepository.findOne({
      where: { id: dto.habitId },
    });

    if (!habit) {
      throw new NotFoundException(`Habit with ID ${dto.habitId} not found`);
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this habit');
    }

    const checkDate = dto.checkDate || this.getTodayDateString();

    const existingCheckIn = await this.checkInRepository.findOne({
      where: { habitId: dto.habitId, checkDate },
    });

    if (existingCheckIn) {
      throw new ConflictException(
        `Already checked in for habit on ${checkDate}`,
      );
    }

    const checkIn = this.checkInRepository.create({
      habitId: dto.habitId,
      userId,
      checkDate,
    });

    const savedCheckIn = await this.checkInRepository.save(checkIn);

    await this.streaksService.updateStreakOnCheckIn(dto.habitId, checkDate);

    return savedCheckIn;
  }

  async batchCheckIn(userId: string, dto: BatchCheckInDto): Promise<CheckIn[]> {
    const checkDate = dto.checkDate || this.getTodayDateString();
    const results: CheckIn[] = [];

    for (const item of dto.habits) {
      try {
        const checkIn = await this.checkIn(userId, {
          habitId: item.habitId,
          checkDate,
        });
        results.push(checkIn);
      } catch (error) {
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return results;
  }

  async undoCheckIn(userId: string, habitId: string, checkDate?: string): Promise<void> {
    const date = checkDate || this.getTodayDateString();

    const checkIn = await this.checkInRepository.findOne({
      where: { habitId, checkDate: date },
    });

    if (!checkIn) {
      throw new NotFoundException(
        `No check-in found for habit on ${date}`,
      );
    }

    if (checkIn.userId !== userId) {
      throw new ForbiddenException('You do not have access to this check-in');
    }

    await this.checkInRepository.remove(checkIn);

    await this.streaksService.recalculateStreak(habitId);
  }

  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    habitId?: string,
  ): Promise<CheckIn[]> {
    const where: Record<string, unknown> = {
      userId,
      checkDate: Between(startDate, endDate),
    };

    if (habitId) {
      where['habitId'] = habitId;
    }

    return this.checkInRepository.find({
      where,
      order: { checkDate: 'ASC' },
      relations: ['habit'],
    });
  }

  async getTodayCheckIns(userId: string): Promise<CheckIn[]> {
    const today = this.getTodayDateString();

    return this.checkInRepository.find({
      where: { userId, checkDate: today },
      relations: ['habit'],
    });
  }

  async isCheckedIn(userId: string, habitId: string, date?: string): Promise<boolean> {
    const checkDate = date || this.getTodayDateString();

    const checkIn = await this.checkInRepository.findOne({
      where: { userId, habitId, checkDate },
    });

    return !!checkIn;
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
