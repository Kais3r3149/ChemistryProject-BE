import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Drug } from '../entities/drug.entity';

@Injectable()
export class DrugsService {
  constructor(
    @InjectRepository(Drug)
    private readonly drugRepository: Repository<Drug>,
  ) {}

  /**
   * Autocomplete/suggest drugs by name prefix.
   * Uses SQL LIKE for fast partial matching.
   */
  async suggest(
    query: string,
    limit = 10,
  ): Promise<{ id: number; name: string; drugbankId: string | null }[]> {
    const drugs = await this.drugRepository.find({
      where: { name: Like(`%${query}%`) },
      select: ['id', 'name', 'drugbankId'],
      take: limit,
      order: { name: 'ASC' },
    });

    return drugs.map((d) => ({
      id: d.id,
      name: d.name,
      drugbankId: d.drugbankId,
    }));
  }

  /**
   * Get drug details by ID.
   */
  async findById(id: number): Promise<Drug | null> {
    return this.drugRepository.findOne({ where: { id } });
  }

  /**
   * Get total drug count (for dashboard stats).
   */
  async count(): Promise<number> {
    return this.drugRepository.count();
  }
}
