import { Module } from '@nestjs/common';
import { SearchParsingService } from './search-parsing.service';

@Module({
  providers: [SearchParsingService],
  exports: [SearchParsingService],
})
export class SearchParsingModule {}
