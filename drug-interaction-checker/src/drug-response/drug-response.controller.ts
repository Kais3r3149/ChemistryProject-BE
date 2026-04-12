import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DrugResponseService } from './drug-response.service';
import { DrugResponseSearchDto } from './dto';

@ApiTags('Drug Response')
@Controller('drug-response')
export class DrugResponseController {
  constructor(private readonly drugResponseService: DrugResponseService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search drug responses (IC50/AUC)' })
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
}
