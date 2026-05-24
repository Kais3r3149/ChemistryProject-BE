import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Drug } from './drug.entity';

/**
 * Drug side effects and disease indications from SIDER 4.1.
 * effectType: 'side_effect' | 'indication'
 */
@Entity('drug_side_effects')
@Index(['drugId', 'effectType'])
export class DrugSideEffect {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugId' })
  drug!: Drug;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  cui!: string | null;

  @Column({ type: 'nvarchar', length: 500 })
  effectName!: string;

  @Column({ type: 'nvarchar', length: 20 })
  effectType!: string;

  @Column({ type: 'nvarchar', length: 50, default: 'SIDER4' })
  source!: string;
}
