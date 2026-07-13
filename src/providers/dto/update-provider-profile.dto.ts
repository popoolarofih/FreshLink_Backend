import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderCategory } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ enum: ProviderCategory })
  @IsOptional()
  @IsEnum(ProviderCategory)
  category?: ProviderCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stateOrRegion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  serviceRadiusKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsInstantBook?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Tag names e.g. vegan, halal' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
