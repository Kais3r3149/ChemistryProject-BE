import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneDiseaseAssociation } from '../entities/gene-disease-association.entity';
import { Gene } from '../entities/gene.entity';
import { Disease } from '../entities/disease.entity';
import { GdaController } from './gda.controller';
import { GdaService } from './gda.service';

@Module({
  imports: [TypeOrmModule.forFeature([GeneDiseaseAssociation, Gene, Disease])],
  controllers: [GdaController],
  providers: [GdaService],
  exports: [GdaService],
})
export class GdaModule {}
