import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DtiSearchDto {
  @ApiProperty({ description: 'Drug ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugId!: number;

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

export class DtiByTargetDto {
  @ApiProperty({ description: 'Target name or UniProt ID', example: 'ABL1' })
  @IsString()
  target!: string;

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
