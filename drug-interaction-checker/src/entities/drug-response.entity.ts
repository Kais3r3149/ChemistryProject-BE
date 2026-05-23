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
import { CellLine } from './cell-line.entity';

/**
 * Drug Response entity.
 * From TDC GDSC datasets — IC50/AUC values.
 */
@Entity('drug_responses')
@Index(['drugId', 'cellLineId'])
export class DrugResponse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugId!: number;

  @Column()
  cellLineId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugId' })
  drug!: Drug;

  @ManyToOne(() => CellLine, { eager: false })
  @JoinColumn({ name: 'cellLineId' })
  cellLine!: CellLine;

  @Column({ type: 'float' })
  value!: number; // IC50 or AUC

  @Column({ type: 'varchar', length: 10, default: 'IC50' })
  metric!: string; // IC50, AUC, EC50

  @Column({ type: 'varchar', length: 50, default: 'TDC-GDSC' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
