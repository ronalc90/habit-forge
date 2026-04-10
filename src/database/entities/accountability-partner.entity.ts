import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum PartnershipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('accountability_partners')
@Index(['user1Id', 'user2Id'], { unique: true })
@Index(['inviteCode'], { unique: true })
export class AccountabilityPartner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1_id' })
  user1!: User;

  @Column({ type: 'uuid', name: 'user1_id' })
  user1Id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2_id' })
  user2!: User;

  @Column({ type: 'uuid', name: 'user2_id', nullable: true })
  user2Id!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: PartnershipStatus.PENDING,
  })
  status!: PartnershipStatus;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'invite_code' })
  inviteCode!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
