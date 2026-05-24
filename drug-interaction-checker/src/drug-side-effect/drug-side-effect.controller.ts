import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DrugSideEffectService } from './drug-side-effect.service';

@ApiTags('Drug Side Effects (SIDER)')
@Controller('drug-side-effects')
export class DrugSideEffectController {
  constructor(private readonly service: DrugSideEffectService) {}

  @Get('by-drug')
  @ApiOperation({ summary: 'Get side effects and indications for a drug (from SIDER 4.1)' })
  @ApiQuery({ name: 'drugId', description: 'Internal drug ID', example: 1 })
  @ApiQuery({ name: 'type', required: false, description: 'side_effect | indication', example: 'side_effect' })
  async findByDrug(
    @Query('drugId') drugId: string,
    @Query('type') type?: string,
  ) {
    if (!drugId || isNaN(Number(drugId))) {
      throw new BadRequestException('drugId is required and must be a number');
    }
    const results = await this.service.findByDrug(Number(drugId), type);
    return {
      success: true,
      data: results,
      meta: { total: results.length },
    };
  }
}
