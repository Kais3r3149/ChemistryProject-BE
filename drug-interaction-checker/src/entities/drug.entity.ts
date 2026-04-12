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

  @Column({ type: 'varchar', length: 1000, nullable: true })
  smiles!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  drugbankId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  pubchemCid!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
