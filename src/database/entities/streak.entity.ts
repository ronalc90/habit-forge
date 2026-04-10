import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Habit } from './habit.entity';

@Entity('streaks')
@Index(['habitId'], { unique: true })
export class Streak {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Habit, (habit) => habit.streak, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit!: Habit;

  @Column({ type: 'uuid', name: 'habit_id', unique: true })
  habitId!: string;

  @Column({ type: 'int', default: 0, name: 'current_streak' })
  currentStreak!: number;

  @Column({ type: 'int', default: 0, name: 'best_streak' })
  bestStreak!: number;

  @Column({ type: 'date', nullable: true, name: 'last_check_date' })
  lastCheckDate!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
