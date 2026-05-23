import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  userId!: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  searchType!: string; // 'ddi' | 'dti' | 'ppi' | 'gda' | 'drug-response'

  @Column({ type: 'varchar', length: 2000 })
  query!: string; // JSON string of search params

  @Column({ type: 'int', default: 0 })
  resultCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
