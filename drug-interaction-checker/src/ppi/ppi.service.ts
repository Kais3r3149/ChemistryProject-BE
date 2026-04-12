import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProteinProteinInteraction } from '../entities/protein-protein-interaction.entity';

export interface PpiResult {
  id: number;
  proteinA: { uniprotId: string; name: string | null };
  proteinB: { uniprotId: string; name: string | null };
  score: number | null;
  source: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PpiService {
  constructor(
    @InjectRepository(ProteinProteinInteraction)
    private readonly ppiRepository: Repository<ProteinProteinInteraction>,
  ) {}

  /**
   * Search PPIs by protein name or UniProt ID (bidirectional).
   */
  async search(
    proteinQuery: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<PpiResult>> {
    const qb = this.ppiRepository
      .createQueryBuilder('ppi')
      .where('ppi.proteinAUniprotId = :q', { q: proteinQuery })
      .orWhere('ppi.proteinBUniprotId = :q', { q: proteinQuery })
      .orWhere('ppi.proteinAName LIKE :like', { like: `%${proteinQuery}%` })
      .orWhere('ppi.proteinBName LIKE :like', { like: `%${proteinQuery}%` })
      .orderBy('ppi.score', 'DESC')
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
    return this.ppiRepository.count();
  }

  private mapToResult(i: ProteinProteinInteraction): PpiResult {
    return {
      id: i.id,
      proteinA: {
        uniprotId: i.proteinAUniprotId,
        name: i.proteinAName,
      },
      proteinB: {
        uniprotId: i.proteinBUniprotId,
        name: i.proteinBName,
      },
      score: i.score,
      source: i.source,
    };
  }
}
