import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DrugFoodService } from './drug-food.service';

@ApiTags('Drug-Food Interactions')
@Controller('drug-food')
export class DrugFoodController {
  constructor(private readonly drugFoodService: DrugFoodService) {}

  @Get('by-drug')
  @ApiOperation({ summary: 'Get food interactions for a drug' })
  @ApiQuery({ name: 'drugId', type: Number })
  async findByDrug(@Query('drugId', ParseIntPipe) drugId: number) {
    const items = await this.drugFoodService.findByDrug(drugId);
    return {
      success: true,
      data: items.map((i) => ({
        id: i.id,
        drug: { id: i.drug.id, name: i.drug.name },
        interaction: i.interaction,
      })),
      meta: { total: items.length },
    };
  }
}
