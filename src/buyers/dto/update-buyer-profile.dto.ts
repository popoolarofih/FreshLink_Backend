import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateBuyerProfileDto {
  @ApiPropertyOptional({ example: 'Ada Obi' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: ['vegan', 'gluten-free'] })
  @IsOptional()
  @IsArray()
  dietaryPreferences?: string[];

  @ApiPropertyOptional({ example: "Ada's Catering Ltd" })
  @IsOptional()
  @IsString()
  businessName?: string;
}
