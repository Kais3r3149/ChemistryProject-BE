import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PpiService } from './ppi.service';
import { PpiSearchDto } from './dto';

@ApiTags('Protein-Protein Interactions')
@Controller('ppi')
export class PpiController {
  constructor(private readonly ppiService: PpiService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search PPIs by protein name or UniProt ID' })
  async search(@Query() dto: PpiSearchDto) {
    const result = await this.ppiService.search(
      dto.protein,
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
