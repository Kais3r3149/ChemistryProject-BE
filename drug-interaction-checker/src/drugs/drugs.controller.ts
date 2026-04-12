import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DrugsService } from './drugs.service';
import { DrugSuggestDto } from './dto/drug-suggest.dto';

@ApiTags('Drugs')
@Controller('drugs')
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Get('suggest')
  @ApiOperation({ summary: 'Autocomplete drug names' })
  async suggest(@Query() dto: DrugSuggestDto) {
    const results = await this.drugsService.suggest(dto.q, dto.limit);
    return { success: true, data: results };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get drug details by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const drug = await this.drugsService.findById(id);

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return { success: true, data: drug };
  }
}
