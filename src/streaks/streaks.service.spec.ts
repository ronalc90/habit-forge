import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StreaksService } from './streaks.service';
import { Streak } from '../database/entities/streak.entity';
import { CheckIn } from '../database/entities/check-in.entity';

describe('StreaksService', () => {
  let service: StreaksService;
  let streakRepository: jest.Mocked<Repository<Streak>>;
  let checkInRepository: jest.Mocked<Repository<CheckIn>>;

  const habitId = '660e8400-e29b-41d4-a716-446655440000';

  const createMockStreak = (overrides: Partial<Streak> = {}): Streak => ({
    id: 'streak-id',
    habitId,
    currentStreak: 0,
    bestStreak: 0,
    lastCheckDate: null,
    updatedAt: new Date(),
    habit: {} as any,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreaksService,
        {
          provide: getRepositoryToken(Streak),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CheckIn),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StreaksService>(StreaksService);
    streakRepository = module.get(getRepositoryToken(Streak)) as jest.Mocked<Repository<Streak>>;
    checkInRepository = module.get(getRepositoryToken(CheckIn)) as jest.Mocked<Repository<CheckIn>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStreakOnCheckIn', () => {
    it('should start a new streak when no previous check-ins exist', async () => {
      const streak = createMockStreak({ lastCheckDate: null, currentStreak: 0 });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(result.currentStreak).toBe(1);
      expect(result.bestStreak).toBe(1);
      expect(result.lastCheckDate).toBe('2024-01-15');
    });

    it('should increment streak when checking in on consecutive day', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2024-01-14',
        currentStreak: 3,
        bestStreak: 5,
      });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(result.currentStreak).toBe(4);
      expect(result.bestStreak).toBe(5);
    });

    it('should reset streak when there is a gap in check-ins', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2024-01-10',
        currentStreak: 5,
        bestStreak: 5,
      });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(result.currentStreak).toBe(1);
      expect(result.bestStreak).toBe(5);
    });

    it('should update best streak when current exceeds it', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2024-01-14',
        currentStreak: 5,
        bestStreak: 5,
      });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(result.currentStreak).toBe(6);
      expect(result.bestStreak).toBe(6);
    });

    it('should not change streak for same-day duplicate check-in', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2024-01-15',
        currentStreak: 3,
        bestStreak: 5,
      });
      streakRepository.findOne.mockResolvedValue(streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBe(5);
    });

    it('should create a new streak record if none exists', async () => {
      streakRepository.findOne.mockResolvedValue(null);
      const newStreak = createMockStreak();
      streakRepository.create.mockReturnValue(newStreak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-15');

      expect(streakRepository.create).toHaveBeenCalled();
      expect(result.currentStreak).toBe(1);
    });

    it('should handle month boundaries correctly', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2024-01-31',
        currentStreak: 5,
        bestStreak: 5,
      });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-02-01');

      expect(result.currentStreak).toBe(6);
    });

    it('should handle year boundaries correctly', async () => {
      const streak = createMockStreak({
        lastCheckDate: '2023-12-31',
        currentStreak: 10,
        bestStreak: 10,
      });
      streakRepository.findOne.mockResolvedValue(streak);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.updateStreakOnCheckIn(habitId, '2024-01-01');

      expect(result.currentStreak).toBe(11);
    });
  });

  describe('recalculateStreak', () => {
    it('should reset streak when no check-ins exist', async () => {
      const streak = createMockStreak({ currentStreak: 5 });
      streakRepository.findOne.mockResolvedValue(streak);
      checkInRepository.find.mockResolvedValue([]);
      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.recalculateStreak(habitId);

      expect(result.currentStreak).toBe(0);
      expect(result.lastCheckDate).toBeNull();
    });

    it('should throw NotFoundException when streak does not exist', async () => {
      streakRepository.findOne.mockResolvedValue(null);

      await expect(service.recalculateStreak(habitId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should correctly recalculate streak from check-in history', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

      const streak = createMockStreak({ currentStreak: 10, bestStreak: 10 });
      streakRepository.findOne.mockResolvedValue(streak);

      checkInRepository.find.mockResolvedValue([
        { checkDate: today } as CheckIn,
        { checkDate: yesterday } as CheckIn,
        { checkDate: twoDaysAgo } as CheckIn,
      ]);

      streakRepository.save.mockImplementation(async (s) => s as Streak);

      const result = await service.recalculateStreak(habitId);

      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getStreak', () => {
    it('should return streak for a habit', async () => {
      const streak = createMockStreak({ currentStreak: 5, bestStreak: 10 });
      streakRepository.findOne.mockResolvedValue(streak);

      const result = await service.getStreak(habitId);

      expect(result.currentStreak).toBe(5);
      expect(result.bestStreak).toBe(10);
    });

    it('should throw NotFoundException when streak does not exist', async () => {
      streakRepository.findOne.mockResolvedValue(null);

      await expect(service.getStreak(habitId)).rejects.toThrow(NotFoundException);
    });
  });
});
