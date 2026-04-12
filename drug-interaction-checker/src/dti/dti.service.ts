import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugTargetInteraction } from '../entities/drug-target-interaction.entity';

export interface DtiResult {
  id: number;
  drug: { id: number; name: string };
  target: { id: number; name: string; uniprotId: string | null };
  affinity: number | null;
  affinityUnit: string | null;
  source: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DtiService {
  constructor(
    @InjectRepository(DrugTargetInteraction)
    private readonly dtiRepository: Repository<DrugTargetInteraction>,
  ) {}

  /**
   * Get all DTIs for a specific drug.
   */
  async findByDrug(
    drugId: number,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<DtiResult>> {
    const [items, total] = await this.dtiRepository.findAndCount({
      where: { drugId },
      relations: ['drug', 'target'],
      skip: (page - 1) * limit,
      take: limit,
      order: { affinity: 'ASC' },
    });

    return {
      items: items.map((i) => this.mapToResult(i)),
      total,
      page,
      limit,
    };
  }

  /**
   * Search DTIs by target name or UniProt ID.
   */
  async findByTarget(
    targetQuery: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<DtiResult>> {
    const qb = this.dtiRepository
      .createQueryBuilder('dti')
      .leftJoinAndSelect('dti.drug', 'drug')
      .leftJoinAndSelect('dti.target', 'target')
      .where('target.name LIKE :q', { q: `%${targetQuery}%` })
      .orWhere('target.uniprotId = :exact', { exact: targetQuery })
      .orWhere('target.geneSymbol = :exact', { exact: targetQuery })
      .orderBy('dti.affinity', 'ASC')
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

  async count(): Promise<number> {
    return this.dtiRepository.count();
  }

  private mapToResult(i: DrugTargetInteraction): DtiResult {
    return {
      id: i.id,
      drug: { id: i.drug.id, name: i.drug.name },
      target: {
        id: i.target.id,
        name: i.target.name,
        uniprotId: i.target.uniprotId,
      },
      affinity: i.affinity,
      affinityUnit: i.affinityUnit,
      source: i.source,
    };
  }
}
