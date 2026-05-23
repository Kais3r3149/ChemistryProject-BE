import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugCondition } from '../entities/drug-condition.entity';

@Injectable()
export class DrugConditionService {
  constructor(
    @InjectRepository(DrugCondition)
    private readonly repo: Repository<DrugCondition>,
  ) {}

  async findByDrug(drugId: number): Promise<DrugCondition[]> {
    return this.repo.find({
      where: { drugId },
      relations: ['drug'],
      order: { type: 'ASC', id: 'ASC' },
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
