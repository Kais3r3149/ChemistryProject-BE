import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Protein-Protein Interaction entity.
 * From TDC PPI datasets (HuRI, STRING).
 */
@Entity('protein_protein_interactions')
@Index(['proteinAUniprotId', 'proteinBUniprotId'])
export class ProteinProteinInteraction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  proteinAUniprotId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  proteinAName!: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  proteinBUniprotId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  proteinBName!: string | null;

  @Column({ type: 'float', nullable: true })
  score!: number | null; // confidence/interaction score

  @Column({ type: 'varchar', length: 50, default: 'TDC' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
