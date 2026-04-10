import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../database/entities/habit.entity';
import { Streak } from '../database/entities/streak.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
  ) {}

  private readonly MAX_ACTIVE_HABITS = 20;

  async create(userId: string, createHabitDto: CreateHabitDto): Promise<Habit> {
    const activeCount = await this.habitRepository.count({
      where: { userId, isActive: true },
    });

    if (activeCount >= this.MAX_ACTIVE_HABITS) {
      throw new BadRequestException(
        `Maximum of ${this.MAX_ACTIVE_HABITS} active habits reached. Deactivate or delete an existing habit first.`,
      );
    }

    const maxOrder = await this.habitRepository
      .createQueryBuilder('habit')
      .select('MAX(habit.sortOrder)', 'max')
      .where('habit.userId = :userId', { userId })
      .getRawOne();

    const habit = this.habitRepository.create({
      ...createHabitDto,
      userId,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    });

    const savedHabit = await this.habitRepository.save(habit);

    const streak = this.streakRepository.create({
      habitId: savedHabit.id,
      currentStreak: 0,
      bestStreak: 0,
    });
    await this.streakRepository.save(streak);

    return savedHabit;
  }

  async findAllActive(userId: string): Promise<Habit[]> {
    return this.habitRepository.find({
      where: { userId, isActive: true },
      order: { sortOrder: 'ASC' },
      relations: ['streak', 'checkIns'],
    });
  }

  async findAll(userId: string): Promise<Habit[]> {
    return this.habitRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC' },
      relations: ['streak', 'checkIns'],
    });
  }

  async findOne(id: string, userId: string): Promise<Habit> {
    const habit = await this.habitRepository.findOne({
      where: { id },
      relations: ['streak'],
    });

    if (!habit) {
      throw new NotFoundException(`Habit with ID ${id} not found`);
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this habit');
    }

    return habit;
  }

  async update(
    id: string,
    userId: string,
    updateHabitDto: UpdateHabitDto,
  ): Promise<Habit> {
    const habit = await this.findOne(id, userId);

    Object.assign(habit, updateHabitDto);

    return this.habitRepository.save(habit);
  }

  async remove(id: string, userId: string): Promise<void> {
    const habit = await this.findOne(id, userId);
    await this.habitRepository.remove(habit);
  }

  async reorder(userId: string, habitIds: string[]): Promise<void> {
    const habits = await this.habitRepository.find({
      where: { userId },
    });

    const userHabitIds = new Set(habits.map((h) => h.id));
    for (const id of habitIds) {
      if (!userHabitIds.has(id)) {
        throw new ForbiddenException(`Habit ${id} does not belong to you`);
      }
    }

    const updates = habitIds.map((id, index) =>
      this.habitRepository.update({ id }, { sortOrder: index }),
    );

    await Promise.all(updates);
  }
}
