import { IsOptional, IsString, MinLength, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GdaSearchDto {
  @ApiPropertyOptional({ description: 'Gene symbol or name', example: 'BRCA1' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  gene?: string;

  @ApiPropertyOptional({ description: 'Disease name or ID', example: 'breast cancer' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  disease?: string;

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
