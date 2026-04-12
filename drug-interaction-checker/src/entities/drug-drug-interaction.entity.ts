import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Drug } from './drug.entity';
import { SeverityLevel } from '../common/types';

/**
 * Drug-Drug Interaction entity.
 * ~191K records from TDC DDI dataset.
 * TDC Y column (0-85) maps to interactionType, then to severity.
 */
@Entity('drug_drug_interactions')
@Index(['drugAId', 'drugBId'])
export class DrugDrugInteraction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugAId!: number;

  @Column()
  drugBId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugAId' })
  drugA!: Drug;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugBId' })
  drugB!: Drug;

  @Column({ type: 'smallint' })
  interactionType!: number; // TDC Y value: 0-85

  @Column({
    type: 'varchar',
    length: 20,
    enum: SeverityLevel,
    default: SeverityLevel.UNKNOWN,
  })
  severity!: SeverityLevel;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description!: string | null;

  @Column({ type: 'float', nullable: true })
  confidence!: number | null;

  @Column({ type: 'varchar', length: 50, default: 'TDC' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
