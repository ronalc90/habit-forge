import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { CheckIn } from './check-in.entity';
import { Streak } from './streak.entity';

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

@Entity('habits')
@Index(['user', 'isActive'])
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.habits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: HabitFrequency.DAILY,
  })
  frequency!: HabitFrequency;

  @Column({ type: 'time', nullable: true, name: 'preferred_time' })
  preferredTime!: string | null;

  @Column({ type: 'int', default: 7, name: 'target_days_per_week' })
  targetDaysPerWeek!: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => CheckIn, (checkIn) => checkIn.habit)
  checkIns!: CheckIn[];

  @OneToOne(() => Streak, (streak) => streak.habit)
  streak!: Streak;
}
