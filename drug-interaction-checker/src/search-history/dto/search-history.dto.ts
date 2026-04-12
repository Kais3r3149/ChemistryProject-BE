import { IsInt, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SearchType {
  DDI = 'ddi',
  DTI = 'dti',
  PPI = 'ppi',
  GDA = 'gda',
  DRUG_RESPONSE = 'drug-response',
}

export class SearchHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by search type', enum: SearchType })
  @IsOptional()
  @IsEnum(SearchType)
  searchType?: SearchType;

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

export class CreateSearchHistoryDto {
  @IsString()
  searchType!: string;

  @IsString()
  query!: string;

  @IsInt()
  @Min(0)
  resultCount!: number;
}
