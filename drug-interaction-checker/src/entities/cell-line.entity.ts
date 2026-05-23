import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('cell_lines')
export class CellLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  cellLineId!: string; // e.g., GDSC cell line ID

  @Column({ type: 'varchar', length: 500 })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tissueName!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancerType!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
