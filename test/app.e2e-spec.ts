import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * E2E test for the full auth -> habit -> check-in -> streak flow.
 *
 * NOTE: This test requires a running PostgreSQL database.
 * Run `docker-compose up -d` before executing.
 * Skipped by default in CI unless DB_HOST is set.
 */
const describeIfDb = process.env.DB_HOST ? describe : describe.skip;

describeIfDb('HabitForge E2E Flow', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let habitId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    const testEmail = `e2e-test-${Date.now()}@example.com`;

    it('POST /api/v1/auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          displayName: 'E2E Test User',
          password: 'securepassword123',
          timezone: 'America/New_York',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);

      authToken = response.body.data.accessToken;
      userId = response.body.data.user.id;
    });

    it('POST /api/v1/auth/register - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          displayName: 'Duplicate User',
          password: 'securepassword123',
        })
        .expect(409);
    });

    it('POST /api/v1/auth/login - should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'securepassword123',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      authToken = response.body.data.accessToken;
    });

    it('POST /api/v1/auth/login - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('GET /api/v1/auth/profile - should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('GET /api/v1/auth/profile - should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  describe('Habit CRUD Flow', () => {
    it('POST /api/v1/habits - should create a habit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning Exercise',
          icon: 'dumbbell',
          frequency: 'daily',
          preferredTime: '07:00',
          targetDaysPerWeek: 7,
        })
        .expect(201);

      expect(response.body.data.name).toBe('Morning Exercise');
      habitId = response.body.data.id;
    });

    it('GET /api/v1/habits - should list habits', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/habits/:id - should get a single habit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(habitId);
      expect(response.body.data.name).toBe('Morning Exercise');
    });

    it('PATCH /api/v1/habits/:id - should update a habit', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Evening Exercise' })
        .expect(200);

      expect(response.body.data.name).toBe('Evening Exercise');
    });
  });

  describe('Check-In + Streak Flow', () => {
    it('POST /api/v1/check-ins - should create a check-in', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/check-ins')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId })
        .expect(201);

      expect(response.body.data.habitId).toBe(habitId);
      expect(response.body.data.checkDate).toBeDefined();
    });

    it('POST /api/v1/check-ins - should prevent duplicate check-in', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/check-ins')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId })
        .expect(409);
    });

    it('GET /api/v1/check-ins/today - should return today check-ins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/check-ins/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
    });

    it('GET /api/v1/dashboard/today - should show streak updated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const summary = response.body.data;
      expect(summary.totalHabits).toBeGreaterThanOrEqual(1);
      expect(summary.completedToday).toBe(1);

      const habitStreak = summary.currentStreaks.find(
        (s: { habitId: string }) => s.habitId === habitId,
      );
      expect(habitStreak?.currentStreak).toBe(1);
      expect(habitStreak?.isCompletedToday).toBe(true);
    });

    it('DELETE /api/v1/check-ins/:habitId - should undo check-in', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/check-ins/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('GET /api/v1/dashboard/today - should show streak reset after undo', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.completedToday).toBe(0);
    });
  });

  describe('Dashboard Flow', () => {
    it('GET /api/v1/dashboard/stats - should return weekly stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats?period=week')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.totalCheckIns).toBeDefined();
      expect(response.body.data.consistencyRate).toBeDefined();
      expect(response.body.data.habitBreakdown).toBeInstanceOf(Array);
    });

    it('GET /api/v1/dashboard/calendar - should return calendar data', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app.getHttpServer())
        .get(`/api/v1/dashboard/calendar?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.dates).toBeInstanceOf(Array);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /api/v1/habits/:id - should delete the habit', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
