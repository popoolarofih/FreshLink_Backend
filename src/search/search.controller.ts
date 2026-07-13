import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';
import { SearchProvidersDto } from './dto/search-providers.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Public endpoint – JWT is optional (used only to pass buyerId for AI ranking).
   * Use query params for structured filters, or pass `q` for natural-language search.
   */
  @Get('providers')
  @ApiOperation({
    summary: 'Search & discover providers',
    description:
      'Supports structured filters and/or a natural-language `q` param. ' +
      'Results are AI-ranked when sortBy=ai (default). Falls back to rating sort if AI is unavailable.',
  })
  searchProviders(@Query() dto: SearchProvidersDto, @Request() req: any) {
    const buyerId = req?.user?.id;
    return this.searchService.searchProviders(dto, buyerId);
  }
}
