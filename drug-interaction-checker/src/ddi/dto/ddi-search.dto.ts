import { IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SeverityLevel } from '../../common/types';

export class DdiSearchDto {
  @ApiProperty({ description: 'Drug A ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugAId!: number;

  @ApiProperty({ description: 'Drug B ID', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugBId!: number;
}

export class DdiByDrugDto {
  @ApiProperty({ description: 'Drug ID to find all interactions', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugId!: number;

  @ApiPropertyOptional({ description: 'Filter by severity', enum: SeverityLevel })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional({ description: 'Page number (default 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page (default 20)', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
