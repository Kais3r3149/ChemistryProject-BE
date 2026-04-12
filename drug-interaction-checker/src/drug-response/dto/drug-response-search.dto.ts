import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DrugResponseSearchDto {
  @ApiProperty({ description: 'Drug ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugId!: number;

  @ApiPropertyOptional({ description: 'Cell line name filter', example: 'MCF7' })
  @IsOptional()
  @IsString()
  cellLine?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
