import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('genes')
export class Gene {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  @Index({ unique: true })
  geneSymbol!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  geneName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  entrezId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
