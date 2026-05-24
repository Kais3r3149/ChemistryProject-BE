import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DrugResponseService } from './drug-response.service';
import { DrugResponseSearchDto } from './dto';

@ApiTags('Drug Response')
@Controller('drug-response')
export class DrugResponseController {
  constructor(private readonly drugResponseService: DrugResponseService) { }

  @Get('search')
  @ApiOperation({ summary: 'Search drug responses by drug ID (IC50/AUC)' })
  async search(@Query() dto: DrugResponseSearchDto) {
    const result = await this.drugResponseService.searchByDrug(
      dto.drugId,
      dto.cellLine,
      dto.page,
      dto.limit,
    );
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('by-name')
  @ApiOperation({ summary: 'Search drug responses by drug name (IC50/AUC)' })
  @ApiQuery({ name: 'drug', description: 'Drug name (partial match)', example: 'Erlotinib' })
  @ApiQuery({ name: 'cellLine', required: false, description: 'Cell line filter', example: 'MCF7' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async searchByName(
    @Query('drug') drug: string,
    @Query('cellLine') cellLine?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!drug || !drug.trim()) {
      throw new BadRequestException('drug query parameter is required');
    }
    const result = await this.drugResponseService.searchByName(
      drug.trim(),
      cellLine,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }
}
