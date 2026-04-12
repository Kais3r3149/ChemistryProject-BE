import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Gene } from './gene.entity';
import { Disease } from './disease.entity';

/**
 * Gene-Disease Association entity.
 * From DisGeNET (~1.1M associations).
 */
@Entity('gene_disease_associations')
@Index(['geneId', 'diseaseId'])
export class GeneDiseaseAssociation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  geneId!: number;

  @Column()
  diseaseId!: number;

  @ManyToOne(() => Gene, { eager: false })
  @JoinColumn({ name: 'geneId' })
  gene!: Gene;

  @ManyToOne(() => Disease, { eager: false })
  @JoinColumn({ name: 'diseaseId' })
  disease!: Disease;

  @Column({ type: 'float' })
  score!: number; // GDA score (0-1)

  @Column({ type: 'float', nullable: true })
  ei!: number | null; // Evidence Index

  @Column({ type: 'float', nullable: true })
  el!: number | null; // Evidence Level

  @Column({ type: 'varchar', length: 50, default: 'DisGeNET' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
