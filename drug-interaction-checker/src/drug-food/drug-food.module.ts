import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugFoodInteraction } from '../entities/drug-food-interaction.entity';
import { DrugFoodService } from './drug-food.service';
import { DrugFoodController } from './drug-food.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DrugFoodInteraction])],
  controllers: [DrugFoodController],
  providers: [DrugFoodService],
  exports: [DrugFoodService],
})
export class DrugFoodModule { }
