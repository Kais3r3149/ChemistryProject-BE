import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GdaService } from './gda.service';
import { GdaSearchDto } from './dto';

@ApiTags('Gene-Disease Associations')
@Controller('gda')
export class GdaController {
  constructor(private readonly gdaService: GdaService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search gene-disease associations' })
  async search(@Query() dto: GdaSearchDto) {
    const result = await this.gdaService.search(
      dto.gene,
      dto.disease,
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
