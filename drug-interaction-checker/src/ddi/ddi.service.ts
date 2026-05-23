import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugDrugInteraction } from '../entities/drug-drug-interaction.entity';
import { SeverityLevel } from '../common/types';

export interface DdiResult {
  id: number;
  drugA: { id: number; name: string };
  drugB: { id: number; name: string };
  severity: SeverityLevel;
  description: string | null;
  source: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DdiService {
  constructor(
    @InjectRepository(DrugDrugInteraction)
    private readonly ddiRepository: Repository<DrugDrugInteraction>,
  ) { }

  /**
   * Search DDI between two specific drugs (bidirectional).
   * Checks both (A→B) and (B→A) directions.
   */
  async searchPair(drugAId: number, drugBId: number): Promise<DdiResult[]> {
    const interactions = await this.ddiRepository.find({
      where: [
        { drugAId, drugBId },
        { drugAId: drugBId, drugBId: drugAId },
      ],
      relations: ['drugA', 'drugB'],
      order: { severity: 'ASC' },
    });

    return interactions.map((i) => this.mapToResult(i));
  }

  /**
   * Get all DDIs for a specific drug with optional severity filter.
   */
  async findByDrug(
    drugId: number,
    severity?: SeverityLevel,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<DdiResult>> {
    const qb = this.ddiRepository
      .createQueryBuilder('ddi')
      .leftJoinAndSelect('ddi.drugA', 'drugA')
      .leftJoinAndSelect('ddi.drugB', 'drugB')
      .where('ddi.drugAId = :drugId OR ddi.drugBId = :drugId', { drugId });

    if (severity) {
      qb.andWhere('ddi.severity = :severity', { severity });
    }

    qb.orderBy('ddi.severity', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((i) => this.mapToResult(i)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get total DDI count (for dashboard stats).
   */
  async count(): Promise<number> {
    return this.ddiRepository.count();
  }

  /**
   * Get severity distribution (for dashboard chart).
   */
  async getSeverityDistribution(): Promise<Record<SeverityLevel, number>> {
    const result = await this.ddiRepository
      .createQueryBuilder('ddi')
      .select('ddi.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ddi.severity')
      .getRawMany<{ severity: SeverityLevel; count: string }>();

    const distribution: Record<SeverityLevel, number> = {
      [SeverityLevel.MAJOR]: 0,
      [SeverityLevel.MODERATE]: 0,
      [SeverityLevel.MINOR]: 0,
      [SeverityLevel.UNKNOWN]: 0,
    };

    for (const row of result) {
      distribution[row.severity] = parseInt(row.count, 10);
    }

    return distribution;
  }

  private mapToResult(i: DrugDrugInteraction): DdiResult {
    return {
      id: i.id,
      drugA: { id: i.drugA.id, name: i.drugA.name },
      drugB: { id: i.drugB.id, name: i.drugB.name },
      severity: i.severity,
      description: i.description,
      source: i.source,
    };
  }
}
