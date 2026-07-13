import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchProvidersDto {
  /** Pass a raw natural-language query; the AI service will parse it into filters.
   *  If specific filter fields are also provided they override parsed results. */
  @ApiPropertyOptional({ example: 'vegan baker in Lagos under ₦50k' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ProviderCategory })
  @IsOptional()
  @IsEnum(ProviderCategory)
  category?: ProviderCategory;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ type: [String], example: ['vegan', 'halal'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: '2025-09-15T09:00:00.000Z' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ example: '2025-09-15T17:00:00.000Z' })
  @IsOptional()
  @IsString()
  availableTo?: string;

  @ApiPropertyOptional({ enum: ['rating', 'price', 'ai'], default: 'ai' })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'price' | 'ai';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
