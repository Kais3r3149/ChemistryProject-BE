import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drug } from '../entities/drug.entity';

@Injectable()
export class DrugsService {
  constructor(
    @InjectRepository(Drug)
    private readonly drugRepository: Repository<Drug>,
  ) { }

  /**
   * Autocomplete/suggest drugs by name.
   * Priority: approved > exact match > starts-with > contains
   */
  async suggest(
    query: string,
    limit = 10,
  ): Promise<{ id: number; name: string; drugbankId: string | null }[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const drugs = await this.drugRepository
      .createQueryBuilder('d')
      .select(['d.id', 'd.name', 'd.drugbankId', 'd.groups'])
      // Use LOWER() to guarantee case-insensitive match regardless of DB collation
      .where('LOWER(d.name) LIKE :pattern', { pattern: `%${q}%` })
      .orderBy(
        `CASE WHEN d.groups LIKE '%approved%' THEN 0 ELSE 1 END`,
        'ASC',
      )
      .addOrderBy('LEN(d.name)', 'ASC')
      .addOrderBy('d.name', 'ASC')
      .take(limit * 5)
      .getMany();

    // Rank: 0 = exact, 1 = starts-with, 2 = word-boundary, 3 = contains
    const scored = drugs.map((d) => {
      const n = d.name.toLowerCase();
      let score = 3;
      if (n === q) score = 0;
      else if (n.startsWith(q)) score = 1;
      else if (n.split(/[\s\-\/]+/).some((w) => w.startsWith(q))) score = 2;
      return { d, score };
    });
    scored.sort(
      (a, b) =>
        a.score - b.score ||
        a.d.name.length - b.d.name.length ||
        a.d.name.localeCompare(b.d.name),
    );

    return scored.slice(0, limit).map(({ d }) => ({
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
