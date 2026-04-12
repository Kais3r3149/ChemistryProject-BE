import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugResponse } from '../entities/drug-response.entity';
import { CellLine } from '../entities/cell-line.entity';
import { DrugResponseController } from './drug-response.controller';
import { DrugResponseService } from './drug-response.service';

@Module({
  imports: [TypeOrmModule.forFeature([DrugResponse, CellLine])],
  controllers: [DrugResponseController],
  providers: [DrugResponseService],
  exports: [DrugResponseService],
})
export class DrugResponseModule {}
