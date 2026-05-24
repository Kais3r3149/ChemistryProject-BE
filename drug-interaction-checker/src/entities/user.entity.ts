import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: string; // 'user' | 'admin'

  @Column({ type: 'bit', default: 1 })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 128, nullable: true })
  resetToken!: string | null;

  @Column({ type: 'datetime', nullable: true })
  resetTokenExpiry!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
