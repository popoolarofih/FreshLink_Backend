import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchParsingModule } from './search-parsing/search-parsing.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';

@Module({
  imports: [SearchParsingModule, MatchmakingModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
