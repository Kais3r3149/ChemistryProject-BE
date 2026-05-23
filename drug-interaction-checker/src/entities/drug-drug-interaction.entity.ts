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
 * ~1.4M records from DrugBank full database XML.
 * drugAId/drugBId reference drugs.id (FK).
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

  @Column({
    type: 'varchar',
    length: 20,
    enum: SeverityLevel,
    default: SeverityLevel.UNKNOWN,
  })
  severity!: SeverityLevel;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DrugBank' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
