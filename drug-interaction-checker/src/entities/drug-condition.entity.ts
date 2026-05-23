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

/**
 * Drug-Condition entity.
 * Stores indications and toxicity info per drug.
 * From DrugBank full database XML (<indication>, <toxicity> fields).
 * type: 'indication' | 'toxicity'
 */
@Entity('drug_conditions')
@Index(['drugId', 'type'])
export class DrugCondition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugId' })
  drug!: Drug;

  @Column({ type: 'varchar', length: 20 })
  type!: string; // 'indication' | 'toxicity'

  @Column({ type: 'nvarchar', length: 'max' })
  text!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
