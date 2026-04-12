import { Injectable } from '@nestjs/common';
import { DrugsService } from '../drugs/drugs.service';
import { DdiService } from '../ddi/ddi.service';
import { DtiService } from '../dti/dti.service';
import { PpiService } from '../ppi/ppi.service';
import { GdaService } from '../gda/gda.service';
import { DrugResponseService } from '../drug-response/drug-response.service';

export interface DashboardStats {
  totalDrugs: number;
  totalDDIs: number;
  totalDTIs: number;
  totalPPIs: number;
  totalGDAs: number;
  totalDrugResponses: number;
  severityDistribution: Record<string, number>;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly drugsService: DrugsService,
    private readonly ddiService: DdiService,
    private readonly dtiService: DtiService,
    private readonly ppiService: PpiService,
    private readonly gdaService: GdaService,
    private readonly drugResponseService: DrugResponseService,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalDrugs,
      totalDDIs,
      totalDTIs,
      totalPPIs,
      totalGDAs,
      totalDrugResponses,
      severityDistribution,
    ] = await Promise.all([
      this.drugsService.count(),
      this.ddiService.count(),
      this.dtiService.count(),
      this.ppiService.count(),
      this.gdaService.count(),
      this.drugResponseService.count(),
      this.ddiService.getSeverityDistribution(),
    ]);

    return {
      totalDrugs,
      totalDDIs,
      totalDTIs,
      totalPPIs,
      totalGDAs,
      totalDrugResponses,
      severityDistribution,
    };
  }
}
