import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitFrequency } from '../database/entities/habit.entity';

describe('HabitsController', () => {
  let controller: HabitsController;
  let habitsService: jest.Mocked<HabitsService>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const habitId = '660e8400-e29b-41d4-a716-446655440000';

  const mockHabit = {
    id: habitId,
    userId,
    name: 'Morning Meditation',
    icon: 'meditation',
    frequency: HabitFrequency.DAILY,
    preferredTime: '07:00',
    targetDaysPerWeek: 7,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    user: {} as any,
    checkIns: [],
    streak: {
      id: 'streak-id',
      habitId,
      currentStreak: 5,
      bestStreak: 10,
      lastCheckDate: '2024-01-15',
      updatedAt: new Date(),
      habit: {} as any,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitsController],
      providers: [
        {
          provide: HabitsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllActive: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            reorder: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HabitsController>(HabitsController);
    habitsService = module.get(HabitsService) as jest.Mocked<HabitsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateHabitDto = {
      name: 'Morning Meditation',
      icon: 'meditation',
      frequency: HabitFrequency.DAILY,
      preferredTime: '07:00',
      targetDaysPerWeek: 7,
    };

    it('should create a new habit', async () => {
      habitsService.create.mockResolvedValue(mockHabit);

      const result = await controller.create(userId, createDto);

      expect(result).toEqual(mockHabit);
      expect(result.name).toBe('Morning Meditation');
      expect(habitsService.create).toHaveBeenCalledWith(userId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all habits', async () => {
      habitsService.findAll.mockResolvedValue([mockHabit]);

      const result = await controller.findAll(userId);

      expect(result).toHaveLength(1);
      expect(habitsService.findAll).toHaveBeenCalledWith(userId);
    });

    it('should return only active habits when active=true', async () => {
      habitsService.findAllActive.mockResolvedValue([mockHabit]);

      const result = await controller.findAll(userId, 'true');

      expect(result).toHaveLength(1);
      expect(habitsService.findAllActive).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return a single habit', async () => {
      habitsService.findOne.mockResolvedValue(mockHabit);

      const result = await controller.findOne(habitId, userId);

      expect(result.id).toBe(habitId);
      expect(habitsService.findOne).toHaveBeenCalledWith(habitId, userId);
    });

    it('should throw NotFoundException when habit does not exist', async () => {
      habitsService.findOne.mockRejectedValue(
        new NotFoundException('Habit not found'),
      );

      await expect(controller.findOne('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when accessing another users habit', async () => {
      habitsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have access to this habit'),
      );

      await expect(controller.findOne(habitId, 'other-user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Evening Meditation',
      targetDaysPerWeek: 5,
    } as UpdateHabitDto;

    it('should update a habit', async () => {
      const updatedHabit = { ...mockHabit, ...updateDto };
      habitsService.update.mockResolvedValue(updatedHabit);

      const result = await controller.update(habitId, userId, updateDto);

      expect(result.name).toBe('Evening Meditation');
      expect(habitsService.update).toHaveBeenCalledWith(habitId, userId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a habit', async () => {
      habitsService.remove.mockResolvedValue(undefined);

      await controller.remove(habitId, userId);

      expect(habitsService.remove).toHaveBeenCalledWith(habitId, userId);
    });
  });

  describe('reorder', () => {
    it('should reorder habits', async () => {
      habitsService.reorder.mockResolvedValue(undefined);

      const reorderDto = { habitIds: [habitId, 'another-id'] };
      await controller.reorder(userId, reorderDto);

      expect(habitsService.reorder).toHaveBeenCalledWith(userId, reorderDto.habitIds);
    });
  });
});
