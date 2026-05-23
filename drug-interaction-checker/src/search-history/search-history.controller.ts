import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchHistoryService } from './search-history.service';
import { SearchHistoryQueryDto } from './dto';
import { User } from '../entities/user.entity';

@ApiTags('Search History')
@Controller('search-history')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) { }

  @Get()
  @ApiOperation({ summary: 'Get current user search history' })
  async findMyHistory(
    @Request() req: { user: User },
    @Query() dto: SearchHistoryQueryDto,
  ) {
    const result = await this.searchHistoryService.findByUser(
      req.user.id,
      dto.searchType,
      dto.page,
      dto.limit,
    );
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent searches (dashboard widget)' })
  async getRecent(@Request() req: { user: User }) {
    const items = await this.searchHistoryService.getRecent(req.user.id);
    return { success: true, data: items };
  }

  @Post()
  @ApiOperation({ summary: 'Record a new search' })
  async create(
    @Request() req: { user: User },
    @Body() body: { searchType: string; query: string; resultCount: number },
  ) {
    const item = await this.searchHistoryService.create(
      req.user.id,
      body.searchType,
      body.query,
      body.resultCount,
    );
    return { success: true, data: item };
  }
}
