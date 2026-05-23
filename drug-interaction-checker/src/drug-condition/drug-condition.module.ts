import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugCondition } from '../entities/drug-condition.entity';
import { DrugConditionService } from './drug-condition.service';
import { DrugConditionController } from './drug-condition.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DrugCondition])],
  controllers: [DrugConditionController],
  providers: [DrugConditionService],
  exports: [DrugConditionService],
})
export class DrugConditionModule { }
