import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DrugsModule } from '../drugs/drugs.module';
import { DdiModule } from '../ddi/ddi.module';
import { DtiModule } from '../dti/dti.module';
import { DrugFoodModule } from '../drug-food/drug-food.module';
import { DrugConditionModule } from '../drug-condition/drug-condition.module';

@Module({
  imports: [
    DrugsModule,
    DdiModule,
    DtiModule,
    DrugFoodModule,
    DrugConditionModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
