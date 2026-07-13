import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GroqClientService } from '../../groq-client/groq-client.service';
import { ParsedSearchFilters } from '../../groq-client/groq-client.types';
import { ParsedFiltersDto } from './dto/parsed-filters.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class SearchParsingService {
  private readonly logger = new Logger(SearchParsingService.name);
  private systemPrompt = '';

  constructor(
    private readonly groqClient: GroqClientService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async loadSystemPrompt(): Promise<string> {
    if (this.systemPrompt) return this.systemPrompt;
    try {
      const filePath = path.join(
        process.cwd(),
        'prompts',
        'search-parsing.prompt.txt',
      );
      this.systemPrompt = await fs.readFile(filePath, 'utf8');
      return this.systemPrompt;
    } catch (err) {
      this.logger.error(`Failed to load search-parsing prompt: ${err}`);
      return 'Extract filters in JSON mode.';
    }
  }

  async parseQuery(rawQuery: string): Promise<ParsedSearchFilters> {
    if (!rawQuery || !rawQuery.trim()) {
      return { confidence: 0, rawQuery };
    }

    // Try cache first
    const cacheKey = `search_parse:${rawQuery.trim().toLowerCase()}`;
    try {
      const cached = await this.cacheManager.get<ParsedSearchFilters>(cacheKey);
      if (cached) {
        this.logger.log(`Search parse cache hit for query: "${rawQuery}"`);
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Failed to read from cache: ${err}`);
    }

    const fallback: ParsedSearchFilters = {
      confidence: 0,
      rawQuery,
    };

    try {
      const systemPromptBase = await this.loadSystemPrompt();
      const todayIso = new Date().toISOString().split('T')[0];
      const systemPrompt = `${systemPromptBase}\n\nToday's date is: ${todayIso}`;

      const response = await this.groqClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Query: "${rawQuery}"` },
        ],
        {
          model: this.groqClient.fastModel,
          temperature: 0.1,
          jsonMode: true,
        },
      );

      const parsedJson = JSON.parse(response.content);

      // Validate with class-validator
      const dtoInstance = plainToInstance(ParsedFiltersDto, parsedJson);
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        this.logger.warn(
          `Validation failed for parsed filters: ${JSON.stringify(errors)}`,
        );
        return fallback;
      }

      const result: ParsedSearchFilters = {
        category: dtoInstance.category,
        cuisineTags: dtoInstance.cuisineTags,
        dietaryTags: dtoInstance.dietaryTags,
        dateFrom: dtoInstance.dateFrom,
        dateTo: dtoInstance.dateTo,
        maxPrice: dtoInstance.maxPrice,
        eventType: dtoInstance.eventType,
        location: dtoInstance.location,
        confidence: dtoInstance.confidence ?? 0.5,
        rawQuery,
      };

      // Cache result
      try {
        await this.cacheManager.set(cacheKey, result, 3600_000); // cache for 1 hour
      } catch (err) {
        this.logger.warn(`Failed to write to cache: ${err}`);
      }

      return result;
    } catch (err) {
      this.logger.error(`Error in parseQuery: ${err}`);
      return fallback;
    }
  }
}
