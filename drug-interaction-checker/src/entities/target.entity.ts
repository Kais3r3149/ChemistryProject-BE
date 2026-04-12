import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('targets')
export class Target {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  uniprotId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  geneSymbol!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  organism!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
