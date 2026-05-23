import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProteinProteinInteraction } from '../entities/protein-protein-interaction.entity';
import { PpiController } from './ppi.controller';
import { PpiService } from './ppi.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProteinProteinInteraction])],
  controllers: [PpiController],
  providers: [PpiService],
  exports: [PpiService],
})
export class PpiModule {}
