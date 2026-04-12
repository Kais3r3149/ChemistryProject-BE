import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DrugsModule } from '../drugs/drugs.module';
import { DdiModule } from '../ddi/ddi.module';
import { DtiModule } from '../dti/dti.module';
import { PpiModule } from '../ppi/ppi.module';
import { GdaModule } from '../gda/gda.module';
import { DrugResponseModule } from '../drug-response/drug-response.module';

@Module({
  imports: [
    DrugsModule,
    DdiModule,
    DtiModule,
    PpiModule,
    GdaModule,
    DrugResponseModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
