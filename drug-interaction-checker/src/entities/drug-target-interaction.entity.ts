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
 * From DrugBank full database XML (<targets> section).
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  knownAction!: string | null; // yes / no / unknown

  @Column({ type: 'varchar', length: 20, default: 'DrugBank' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
