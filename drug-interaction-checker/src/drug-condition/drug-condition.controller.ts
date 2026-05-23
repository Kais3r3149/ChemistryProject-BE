import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DrugConditionService } from './drug-condition.service';

@ApiTags('Drug-Condition')
@Controller('drug-condition')
export class DrugConditionController {
  constructor(private readonly drugConditionService: DrugConditionService) {}

  @Get('by-drug')
  @ApiOperation({ summary: 'Get indications and toxicity for a drug' })
  @ApiQuery({ name: 'drugId', type: Number })
  async findByDrug(@Query('drugId', ParseIntPipe) drugId: number) {
    const items = await this.drugConditionService.findByDrug(drugId);
    return {
      success: true,
      data: items.map((i) => ({
        id: i.id,
        drug: { id: i.drug.id, name: i.drug.name },
        type: i.type,
        text: i.text,
      })),
      meta: { total: items.length },
    };
  }
}
