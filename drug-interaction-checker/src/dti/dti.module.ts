import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugTargetInteraction } from '../entities/drug-target-interaction.entity';
import { Target } from '../entities/target.entity';
import { DtiController } from './dti.controller';
import { DtiService } from './dti.service';

@Module({
  imports: [TypeOrmModule.forFeature([DrugTargetInteraction, Target])],
  controllers: [DtiController],
  providers: [DtiService],
  exports: [DtiService],
})
export class DtiModule {}
