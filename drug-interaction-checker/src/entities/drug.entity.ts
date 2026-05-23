import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  drugbankId!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  smiles!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  casNumber!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  indication!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  pharmacodynamics!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  mechanismOfAction!: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  toxicity!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  groups!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
