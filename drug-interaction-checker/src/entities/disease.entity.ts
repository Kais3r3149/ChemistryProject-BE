import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('diseases')
export class Disease {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  @Index({ unique: true })
  diseaseId!: string; // UMLS CUI or MONDO ID

  @Column({ type: 'varchar', length: 500 })
  @Index()
  diseaseName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  diseaseType!: string | null; // disease, phenotype, group

  @Column({ type: 'varchar', length: 50, nullable: true })
  diseaseClass!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
