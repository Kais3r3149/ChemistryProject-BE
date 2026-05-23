import { Injectable } from '@nestjs/common';
import { DrugsService } from '../drugs/drugs.service';
import { DdiService } from '../ddi/ddi.service';
import { DtiService } from '../dti/dti.service';
import { DrugFoodService } from '../drug-food/drug-food.service';
import { DrugConditionService } from '../drug-condition/drug-condition.service';

export interface DashboardStats {
  totalDrugs: number;
  totalDDIs: number;
  totalDTIs: number;
  totalFoodInteractions: number;
  totalConditions: number;
  severityDistribution: Record<string, number>;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly drugsService: DrugsService,
    private readonly ddiService: DdiService,
    private readonly dtiService: DtiService,
    private readonly drugFoodService: DrugFoodService,
    private readonly drugConditionService: DrugConditionService,
  ) { }

  async getStats(): Promise<DashboardStats> {
    const [
      totalDrugs,
      totalDDIs,
      totalDTIs,
      totalFoodInteractions,
      totalConditions,
      severityDistribution,
    ] = await Promise.all([
      this.drugsService.count(),
      this.ddiService.count(),
      this.dtiService.count(),
      this.drugFoodService.count(),
      this.drugConditionService.count(),
      this.ddiService.getSeverityDistribution(),
    ]);

    return {
      totalDrugs,
      totalDDIs,
      totalDTIs,
      totalFoodInteractions,
      totalConditions,
      severityDistribution,
    };
  }
}
