import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "habit_frequency_enum" AS ENUM ('daily', 'weekly', 'custom')
    `);

    await queryRunner.query(`
      CREATE TYPE "partnership_status_enum" AS ENUM ('pending', 'accepted', 'declined')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "avatar_url" varchar(500),
        "timezone" varchar(50) NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Create habits table
    await queryRunner.query(`
      CREATE TABLE "habits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "icon" varchar(50),
        "frequency" "habit_frequency_enum" NOT NULL DEFAULT 'daily',
        "preferred_time" TIME,
        "target_days_per_week" int NOT NULL DEFAULT 7,
        "sort_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_habits" PRIMARY KEY ("id"),
        CONSTRAINT "FK_habits_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_habits_user_active" ON "habits" ("user_id", "is_active")
    `);

    // Create check_ins table
    await queryRunner.query(`
      CREATE TABLE "check_ins" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "habit_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "check_date" date NOT NULL,
        "completed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_check_ins" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_check_in_habit_date" UNIQUE ("habit_id", "check_date"),
        CONSTRAINT "FK_check_ins_habit" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_check_ins_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_check_ins_habit_date" ON "check_ins" ("habit_id", "check_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_check_ins_user_date" ON "check_ins" ("user_id", "check_date")
    `);

    // Create streaks table
    await queryRunner.query(`
      CREATE TABLE "streaks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "habit_id" uuid NOT NULL,
        "current_streak" int NOT NULL DEFAULT 0,
        "best_streak" int NOT NULL DEFAULT 0,
        "last_check_date" date,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_streaks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_streaks_habit" UNIQUE ("habit_id"),
        CONSTRAINT "FK_streaks_habit" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE
      )
    `);

    // Create accountability_partners table
    await queryRunner.query(`
      CREATE TABLE "accountability_partners" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user1_id" uuid NOT NULL,
        "user2_id" uuid,
        "status" "partnership_status_enum" NOT NULL DEFAULT 'pending',
        "invite_code" varchar(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accountability_partners" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accountability_invite_code" UNIQUE ("invite_code"),
        CONSTRAINT "FK_accountability_user1" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_accountability_user2" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_accountability_users" ON "accountability_partners" ("user1_id", "user2_id")
    `);

    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accountability_partners"`);
    await queryRunner.query(`DROP TABLE "streaks"`);
    await queryRunner.query(`DROP TABLE "check_ins"`);
    await queryRunner.query(`DROP TABLE "habits"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "partnership_status_enum"`);
    await queryRunner.query(`DROP TYPE "habit_frequency_enum"`);
  }
}
