import { IsOptional, IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DrugSuggestDto {
  @ApiProperty({ description: 'Search query (min 2 chars)', example: 'aspir' })
  @IsString()
  @MinLength(2)
  q!: string;

  @ApiPropertyOptional({ description: 'Max results (default 10, max 50)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
