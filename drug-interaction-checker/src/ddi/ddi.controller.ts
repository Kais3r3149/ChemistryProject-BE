import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DdiService } from './ddi.service';
import { DdiSearchDto, DdiByDrugDto } from './dto';

@ApiTags('Drug-Drug Interactions')
@Controller('ddi')
export class DdiController {
  constructor(private readonly ddiService: DdiService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search DDI between two drugs' })
  async searchPair(@Query() dto: DdiSearchDto) {
    const results = await this.ddiService.searchPair(dto.drugAId, dto.drugBId);
    return {
      success: true,
      data: results,
      meta: { total: results.length },
    };
  }

  @Get('by-drug')
  @ApiOperation({ summary: 'Get all DDIs for a drug' })
  async findByDrug(@Query() dto: DdiByDrugDto) {
    const result = await this.ddiService.findByDrug(
      dto.drugId,
      dto.severity,
      dto.page,
      dto.limit,
    );
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get('severity-distribution')
  @ApiOperation({ summary: 'Get DDI severity distribution' })
  async getSeverityDistribution() {
    const distribution = await this.ddiService.getSeverityDistribution();
    return { success: true, data: distribution };
  }
}
