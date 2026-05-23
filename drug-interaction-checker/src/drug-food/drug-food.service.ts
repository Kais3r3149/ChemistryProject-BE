import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugFoodInteraction } from '../entities/drug-food-interaction.entity';

@Injectable()
export class DrugFoodService {
  constructor(
    @InjectRepository(DrugFoodInteraction)
    private readonly repo: Repository<DrugFoodInteraction>,
  ) {}

  async findByDrug(drugId: number): Promise<DrugFoodInteraction[]> {
    return this.repo.find({
      where: { drugId },
      relations: ['drug'],
      order: { id: 'ASC' },
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
