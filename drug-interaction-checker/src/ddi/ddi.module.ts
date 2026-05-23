import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugDrugInteraction } from '../entities/drug-drug-interaction.entity';
import { DdiController } from './ddi.controller';
import { DdiService } from './ddi.service';

@Module({
  imports: [TypeOrmModule.forFeature([DrugDrugInteraction])],
  controllers: [DdiController],
  providers: [DdiService],
  exports: [DdiService],
})
export class DdiModule {}
