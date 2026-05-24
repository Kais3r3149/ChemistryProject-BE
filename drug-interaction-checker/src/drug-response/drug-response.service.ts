import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugResponse } from '../entities/drug-response.entity';

export interface DrugResponseResult {
  id: number;
  drug: { id: number; name: string };
  cellLine: { id: number; name: string; tissueName: string | null; cancerType: string | null };
  value: number;
  metric: string;
  source: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DrugResponseService {
  constructor(
    @InjectRepository(DrugResponse)
    private readonly drugResponseRepository: Repository<DrugResponse>,
  ) { }

  /**
   * Search drug responses by drug name (partial match).
   */
  async searchByName(
    drugName: string,
    cellLineFilter?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<DrugResponseResult>> {
    const qb = this.drugResponseRepository
      .createQueryBuilder('dr')
      .leftJoinAndSelect('dr.drug', 'drug')
      .leftJoinAndSelect('dr.cellLine', 'cellLine')
      .where('drug.name LIKE :name', { name: `%${drugName}%` });

    if (cellLineFilter) {
      qb.andWhere('cellLine.name LIKE :cl', { cl: `%${cellLineFilter}%` });
    }

    qb.orderBy('dr.value', 'ASC')
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
   * Search drug responses by drug with optional cell line filter.
   */
  async searchByDrug(
    drugId: number,
    cellLineFilter?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<DrugResponseResult>> {
    const qb = this.drugResponseRepository
      .createQueryBuilder('dr')
      .leftJoinAndSelect('dr.drug', 'drug')
      .leftJoinAndSelect('dr.cellLine', 'cellLine')
      .where('dr.drugId = :drugId', { drugId });

    if (cellLineFilter) {
      qb.andWhere('cellLine.name LIKE :cl', { cl: `%${cellLineFilter}%` });
    }

    qb.orderBy('dr.value', 'ASC')
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
    return this.drugResponseRepository.count();
  }

  private mapToResult(i: DrugResponse): DrugResponseResult {
    return {
      id: i.id,
      drug: { id: i.drug.id, name: i.drug.name },
      cellLine: {
        id: i.cellLine.id,
        name: i.cellLine.name,
        tissueName: i.cellLine.tissueName,
        cancerType: i.cellLine.cancerType,
      },
      value: i.value,
      metric: i.metric,
      source: i.source,
    };
  }
}
