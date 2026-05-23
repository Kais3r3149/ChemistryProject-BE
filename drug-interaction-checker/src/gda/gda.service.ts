import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneDiseaseAssociation } from '../entities/gene-disease-association.entity';

export interface GdaResult {
  id: number;
  gene: { id: number; geneSymbol: string; geneName: string | null };
  disease: { id: number; diseaseName: string; diseaseType: string | null };
  score: number;
  ei: number | null;
  el: number | null;
  source: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GdaService {
  constructor(
    @InjectRepository(GeneDiseaseAssociation)
    private readonly gdaRepository: Repository<GeneDiseaseAssociation>,
  ) {}

  /**
   * Search GDAs by gene and/or disease.
   * At least one of gene or disease must be provided.
   */
  async search(
    gene?: string,
    disease?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<GdaResult>> {
    if (!gene && !disease) {
      throw new BadRequestException(
        'At least one of "gene" or "disease" must be provided',
      );
    }

    const qb = this.gdaRepository
      .createQueryBuilder('gda')
      .leftJoinAndSelect('gda.gene', 'gene')
      .leftJoinAndSelect('gda.disease', 'disease');

    if (gene) {
      qb.andWhere(
        '(gene.geneSymbol LIKE :gene OR gene.geneName LIKE :gene)',
        { gene: `%${gene}%` },
      );
    }

    if (disease) {
      qb.andWhere(
        '(disease.diseaseName LIKE :disease OR disease.diseaseId = :diseaseExact)',
        { disease: `%${disease}%`, diseaseExact: disease },
      );
    }

    qb.orderBy('gda.score', 'DESC')
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
    return this.gdaRepository.count();
  }

  private mapToResult(i: GeneDiseaseAssociation): GdaResult {
    return {
      id: i.id,
      gene: {
        id: i.gene.id,
        geneSymbol: i.gene.geneSymbol,
        geneName: i.gene.geneName,
      },
      disease: {
        id: i.disease.id,
        diseaseName: i.disease.diseaseName,
        diseaseType: i.disease.diseaseType,
      },
      score: i.score,
      ei: i.ei,
      el: i.el,
      source: i.source,
    };
  }
}
