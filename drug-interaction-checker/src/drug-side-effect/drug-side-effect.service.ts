import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugSideEffect } from '../entities/drug-side-effect.entity';

export interface SideEffectResult {
  id: number;
  effectName: string;
  effectType: string;
  cui: string | null;
}

@Injectable()
export class DrugSideEffectService {
  constructor(
    @InjectRepository(DrugSideEffect)
    private readonly repo: Repository<DrugSideEffect>,
  ) {}

  async findByDrug(drugId: number, effectType?: string): Promise<SideEffectResult[]> {
    const qb = this.repo
      .createQueryBuilder('se')
      .where('se.drugId = :drugId', { drugId })
      .orderBy('se.effectName', 'ASC');

    if (effectType) {
      qb.andWhere('se.effectType = :effectType', { effectType });
    }

    const items = await qb.getMany();
    return items.map((i) => ({
      id: i.id,
      effectName: i.effectName,
      effectType: i.effectType,
      cui: i.cui,
    }));
  }
}
