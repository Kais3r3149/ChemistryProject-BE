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
import { Target } from './target.entity';

/**
 * Drug-Target Interaction entity.
 * From TDC DTI datasets (DAVIS, BindingDB, KIBA).
 */
@Entity('drug_target_interactions')
@Index(['drugId', 'targetId'])
export class DrugTargetInteraction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugId!: number;

  @Column()
  targetId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugId' })
  drug!: Drug;

  @ManyToOne(() => Target, { eager: false })
  @JoinColumn({ name: 'targetId' })
  target!: Target;

  @Column({ type: 'float', nullable: true })
  affinity!: number | null; // Kd, Ki, IC50, or binding score

  @Column({ type: 'varchar', length: 20, nullable: true })
  affinityUnit!: string | null; // nM, uM, etc.

  @Column({ type: 'varchar', length: 50, default: 'TDC' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
