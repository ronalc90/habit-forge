import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Habit, HabitFrequency } from '../database/entities/habit.entity';
import { CheckIn } from '../database/entities/check-in.entity';
import { Streak } from '../database/entities/streak.entity';
import { DashboardPeriod } from './dto/dashboard-query.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let habitRepository: jest.Mocked<Repository<Habit>>;
  let checkInRepository: jest.Mocked<Repository<CheckIn>>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const today = new Date().toISOString().split('T')[0];

  const mockHabits: Habit[] = [
    {
      id: 'habit-1',
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
      streak: {
        id: 'streak-1',
        habitId: 'habit-1',
        currentStreak: 5,
        bestStreak: 10,
        lastCheckDate: today,
        updatedAt: new Date(),
        habit: {} as any,
      },
    },
    {
      id: 'habit-2',
      userId,
      name: 'Read',
      icon: null,
      frequency: HabitFrequency.DAILY,
      preferredTime: null,
      targetDaysPerWeek: 5,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      user: {} as any,
      checkIns: [],
      streak: {
        id: 'streak-2',
        habitId: 'habit-2',
        currentStreak: 3,
        bestStreak: 7,
        lastCheckDate: today,
        updatedAt: new Date(),
        habit: {} as any,
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Habit),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CheckIn),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Streak),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    habitRepository = module.get(getRepositoryToken(Habit)) as jest.Mocked<Repository<Habit>>;
    checkInRepository = module.get(getRepositoryToken(CheckIn)) as jest.Mocked<Repository<CheckIn>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTodaySummary', () => {
    it('should return correct summary when all habits completed', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([
        { habitId: 'habit-1', checkDate: today } as CheckIn,
        { habitId: 'habit-2', checkDate: today } as CheckIn,
      ]);

      const result = await service.getTodaySummary(userId);

      expect(result.totalHabits).toBe(2);
      expect(result.completedToday).toBe(2);
      expect(result.completionRate).toBe(100);
      expect(result.currentStreaks).toHaveLength(2);
    });

    it('should return correct summary when some habits completed', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([
        { habitId: 'habit-1', checkDate: today } as CheckIn,
      ]);

      const result = await service.getTodaySummary(userId);

      expect(result.totalHabits).toBe(2);
      expect(result.completedToday).toBe(1);
      expect(result.completionRate).toBe(50);
    });

    it('should return 0% when no habits completed', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([]);

      const result = await service.getTodaySummary(userId);

      expect(result.completedToday).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it('should return 0 for everything when user has no habits', async () => {
      habitRepository.find.mockResolvedValue([]);
      checkInRepository.find.mockResolvedValue([]);

      const result = await service.getTodaySummary(userId);

      expect(result.totalHabits).toBe(0);
      expect(result.completedToday).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.currentStreaks).toHaveLength(0);
    });

    it('should include streak data for each habit', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([
        { habitId: 'habit-1', checkDate: today } as CheckIn,
      ]);

      const result = await service.getTodaySummary(userId);

      const exerciseStreak = result.currentStreaks.find(
        (s) => s.habitId === 'habit-1',
      );
      expect(exerciseStreak?.currentStreak).toBe(5);
      expect(exerciseStreak?.bestStreak).toBe(10);
      expect(exerciseStreak?.isCompletedToday).toBe(true);

      const readStreak = result.currentStreaks.find(
        (s) => s.habitId === 'habit-2',
      );
      expect(readStreak?.isCompletedToday).toBe(false);
    });
  });

  describe('getCalendarData', () => {
    it('should return calendar data for a date range', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([
        { habitId: 'habit-1', checkDate: '2024-01-15' } as CheckIn,
        { habitId: 'habit-2', checkDate: '2024-01-15' } as CheckIn,
        { habitId: 'habit-1', checkDate: '2024-01-16' } as CheckIn,
      ]);

      const result = await service.getCalendarData(
        userId,
        '2024-01-15',
        '2024-01-17',
      );

      expect(result.dates).toHaveLength(3);
      expect(result.dates[0].completedCount).toBe(2);
      expect(result.dates[0].completionRate).toBe(100);
      expect(result.dates[1].completedCount).toBe(1);
      expect(result.dates[1].completionRate).toBe(50);
      expect(result.dates[2].completedCount).toBe(0);
    });
  });

  describe('getPeriodStats', () => {
    it('should return weekly stats', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([
        { habitId: 'habit-1', checkDate: '2024-01-15' } as CheckIn,
        { habitId: 'habit-1', checkDate: '2024-01-16' } as CheckIn,
        { habitId: 'habit-2', checkDate: '2024-01-15' } as CheckIn,
      ]);

      const result = await service.getPeriodStats(
        userId,
        DashboardPeriod.WEEK,
        '2024-01-15',
      );

      expect(result.totalCheckIns).toBe(3);
      expect(result.habitBreakdown).toHaveLength(2);

      const exerciseBreakdown = result.habitBreakdown.find(
        (h) => h.habitId === 'habit-1',
      );
      expect(exerciseBreakdown?.checkIns).toBe(2);
    });

    it('should return 0 consistency when no check-ins', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([]);

      const result = await service.getPeriodStats(
        userId,
        DashboardPeriod.WEEK,
        '2024-01-15',
      );

      expect(result.totalCheckIns).toBe(0);
      expect(result.consistencyRate).toBe(0);
    });

    it('should handle monthly period', async () => {
      habitRepository.find.mockResolvedValue(mockHabits);
      checkInRepository.find.mockResolvedValue([]);

      const result = await service.getPeriodStats(
        userId,
        DashboardPeriod.MONTH,
        '2024-01-15',
      );

      expect(result.period).toContain('2024-01-01');
      expect(result.period).toContain('2024-01-31');
    });
  });
});
