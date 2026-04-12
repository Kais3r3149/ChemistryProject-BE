import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DtiService } from './dti.service';
import { DtiSearchDto, DtiByTargetDto } from './dto';

@ApiTags('Drug-Target Interactions')
@Controller('dti')
export class DtiController {
  constructor(private readonly dtiService: DtiService) {}

  @Get('by-drug')
  @ApiOperation({ summary: 'Get DTIs for a drug' })
  async findByDrug(@Query() dto: DtiSearchDto) {
    const result = await this.dtiService.findByDrug(
      dto.drugId,
      dto.page,
      dto.limit,
    );
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('by-target')
  @ApiOperation({ summary: 'Search DTIs by target name or UniProt ID' })
  async findByTarget(@Query() dto: DtiByTargetDto) {
    const result = await this.dtiService.findByTarget(
      dto.target,
      dto.page,
      dto.limit,
    );
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }
}
