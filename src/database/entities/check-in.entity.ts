import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Habit } from './habit.entity';
import { User } from './user.entity';

@Entity('check_ins')
@Unique('UQ_check_in_habit_date', ['habitId', 'checkDate'])
@Index(['habitId', 'checkDate'])
@Index(['userId', 'checkDate'])
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Habit, (habit) => habit.checkIns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit!: Habit;

  @Column({ type: 'uuid', name: 'habit_id' })
  habitId!: string;

  @ManyToOne(() => User, (user) => user.checkIns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'date', name: 'check_date' })
  checkDate!: string;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt!: Date;
}
