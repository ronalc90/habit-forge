import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CheckInsService } from './check-ins.service';
import { CheckIn } from '../database/entities/check-in.entity';
import { Habit, HabitFrequency } from '../database/entities/habit.entity';
import { StreaksService } from '../streaks/streaks.service';

describe('CheckInsService', () => {
  let service: CheckInsService;
  let checkInRepository: jest.Mocked<Repository<CheckIn>>;
  let habitRepository: jest.Mocked<Repository<Habit>>;
  let streaksService: jest.Mocked<StreaksService>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const habitId = '660e8400-e29b-41d4-a716-446655440000';
  const today = new Date().toISOString().split('T')[0];

  const mockHabit: Habit = {
    id: habitId,
    userId,
    name: 'Exercise',
    icon: null,
    frequency: HabitFrequency.DAILY,
    preferredTime: null,
    targetDaysPerWeek: 7,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    user: {} as any,
    checkIns: [],
    streak: {} as any,
  };

  const mockCheckIn: CheckIn = {
    id: 'checkin-id',
    habitId,
    userId,
    checkDate: today,
    completedAt: new Date(),
    habit: mockHabit,
    user: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInsService,
        {
          provide: getRepositoryToken(CheckIn),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Habit),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StreaksService,
          useValue: {
            updateStreakOnCheckIn: jest.fn(),
            recalculateStreak: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckInsService>(CheckInsService);
    checkInRepository = module.get(getRepositoryToken(CheckIn)) as jest.Mocked<Repository<CheckIn>>;
    habitRepository = module.get(getRepositoryToken(Habit)) as jest.Mocked<Repository<Habit>>;
    streaksService = module.get(StreaksService) as jest.Mocked<StreaksService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('should create a check-in for today', async () => {
      habitRepository.findOne.mockResolvedValue(mockHabit);
      checkInRepository.findOne.mockResolvedValue(null);
      checkInRepository.create.mockReturnValue(mockCheckIn);
      checkInRepository.save.mockResolvedValue(mockCheckIn);
      streaksService.updateStreakOnCheckIn.mockResolvedValue({} as any);

      const result = await service.checkIn(userId, { habitId });

      expect(result).toEqual(mockCheckIn);
      expect(streaksService.updateStreakOnCheckIn).toHaveBeenCalledWith(
        habitId,
        expect.any(String),
      );
    });

    it('should create a check-in for a specific date', async () => {
      const specificDate = '2024-01-15';
      habitRepository.findOne.mockResolvedValue(mockHabit);
      checkInRepository.findOne.mockResolvedValue(null);
      checkInRepository.create.mockReturnValue({ ...mockCheckIn, checkDate: specificDate });
      checkInRepository.save.mockResolvedValue({ ...mockCheckIn, checkDate: specificDate });
      streaksService.updateStreakOnCheckIn.mockResolvedValue({} as any);

      const result = await service.checkIn(userId, { habitId, checkDate: specificDate });

      expect(result.checkDate).toBe(specificDate);
      expect(streaksService.updateStreakOnCheckIn).toHaveBeenCalledWith(habitId, specificDate);
    });

    it('should throw NotFoundException when habit does not exist', async () => {
      habitRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIn(userId, { habitId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when habit belongs to another user', async () => {
      habitRepository.findOne.mockResolvedValue({
        ...mockHabit,
        userId: 'another-user',
      });

      await expect(service.checkIn(userId, { habitId })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException for duplicate check-in', async () => {
      habitRepository.findOne.mockResolvedValue(mockHabit);
      checkInRepository.findOne.mockResolvedValue(mockCheckIn);

      await expect(service.checkIn(userId, { habitId })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('undoCheckIn', () => {
    it('should remove a check-in and recalculate streak', async () => {
      checkInRepository.findOne.mockResolvedValue(mockCheckIn);
      checkInRepository.remove.mockResolvedValue(mockCheckIn);
      streaksService.recalculateStreak.mockResolvedValue({} as any);

      await service.undoCheckIn(userId, habitId);

      expect(checkInRepository.remove).toHaveBeenCalledWith(mockCheckIn);
      expect(streaksService.recalculateStreak).toHaveBeenCalledWith(habitId);
    });

    it('should throw NotFoundException when check-in does not exist', async () => {
      checkInRepository.findOne.mockResolvedValue(null);

      await expect(service.undoCheckIn(userId, habitId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when check-in belongs to another user', async () => {
      checkInRepository.findOne.mockResolvedValue({
        ...mockCheckIn,
        userId: 'another-user',
      });

      await expect(service.undoCheckIn(userId, habitId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('batchCheckIn', () => {
    it('should create multiple check-ins and skip duplicates', async () => {
      const habits = [{ habitId }, { habitId: 'habit-2' }];

      habitRepository.findOne
        .mockResolvedValueOnce(mockHabit)
        .mockResolvedValueOnce({ ...mockHabit, id: 'habit-2' });

      checkInRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const checkIn1 = { ...mockCheckIn };
      const checkIn2 = { ...mockCheckIn, id: 'checkin-2', habitId: 'habit-2' };
      checkInRepository.create
        .mockReturnValueOnce(checkIn1)
        .mockReturnValueOnce(checkIn2);
      checkInRepository.save
        .mockResolvedValueOnce(checkIn1)
        .mockResolvedValueOnce(checkIn2);

      streaksService.updateStreakOnCheckIn.mockResolvedValue({} as any);

      const result = await service.batchCheckIn(userId, { habits });

      expect(result).toHaveLength(2);
    });
  });

  describe('getByDateRange', () => {
    it('should return check-ins within date range', async () => {
      checkInRepository.find.mockResolvedValue([mockCheckIn]);

      const result = await service.getByDateRange(
        userId,
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toHaveLength(1);
      expect(checkInRepository.find).toHaveBeenCalled();
    });

    it('should filter by habitId when provided', async () => {
      checkInRepository.find.mockResolvedValue([mockCheckIn]);

      await service.getByDateRange(userId, '2024-01-01', '2024-01-31', habitId);

      expect(checkInRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ habitId }),
        }),
      );
    });
  });
});
