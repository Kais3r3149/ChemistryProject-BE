import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugSideEffect } from '../entities/drug-side-effect.entity';
import { DrugSideEffectService } from './drug-side-effect.service';
import { DrugSideEffectController } from './drug-side-effect.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DrugSideEffect])],
  providers: [DrugSideEffectService],
  controllers: [DrugSideEffectController],
  exports: [DrugSideEffectService],
})
export class DrugSideEffectModule {}
