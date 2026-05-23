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

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  drugbankTargetId!: string | null;  // BE0000xxx

  @Column({ type: 'varchar', length: 500 })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  uniprotId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  geneName!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  geneSymbol!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  organism!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  generalFunction!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  specificFunction!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
