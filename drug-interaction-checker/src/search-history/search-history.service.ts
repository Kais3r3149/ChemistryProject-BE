import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from '../entities/search-history.entity';

export interface SearchHistoryItem {
  id: number;
  searchType: string;
  query: string;
  resultCount: number;
  createdAt: Date;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SearchHistoryService {
  constructor(
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  /**
   * Record a new search.
   */
  async create(
    userId: number,
    searchType: string,
    query: string,
    resultCount: number,
  ): Promise<SearchHistory> {
    const entry = this.searchHistoryRepository.create({
      userId,
      searchType,
      query,
      resultCount,
    });
    return this.searchHistoryRepository.save(entry);
  }

  /**
   * Get user's search history with optional type filter.
   */
  async findByUser(
    userId: number,
    searchType?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<SearchHistoryItem>> {
    const qb = this.searchHistoryRepository
      .createQueryBuilder('sh')
      .where('sh.userId = :userId', { userId });

    if (searchType) {
      qb.andWhere('sh.searchType = :searchType', { searchType });
    }

    qb.orderBy('sh.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((i) => ({
        id: i.id,
        searchType: i.searchType,
        query: i.query,
        resultCount: i.resultCount,
        createdAt: i.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get recent searches (for dashboard widget).
   */
  async getRecent(userId: number, count = 5): Promise<SearchHistoryItem[]> {
    const items = await this.searchHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: count,
    });

    return items.map((i) => ({
      id: i.id,
      searchType: i.searchType,
      query: i.query,
      resultCount: i.resultCount,
      createdAt: i.createdAt,
    }));
  }
}
