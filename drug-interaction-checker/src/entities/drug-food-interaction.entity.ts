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
 * Drug-Food Interaction entity.
 * From DrugBank full database XML (<food-interactions> section).
 */
@Entity('drug_food_interactions')
@Index(['drugId'])
export class DrugFoodInteraction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  drugId!: number;

  @ManyToOne(() => Drug, { eager: false })
  @JoinColumn({ name: 'drugId' })
  drug!: Drug;

  @Column({ type: 'nvarchar', length: 'max' })
  interaction!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
