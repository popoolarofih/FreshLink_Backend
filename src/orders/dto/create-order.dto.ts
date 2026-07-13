import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'ProviderProfile ID to book' })
  @IsUUID()
  providerProfileId: string;

  @ApiProperty({ example: 'Full-day catering for a 200-person corporate event' })
  @IsString()
  serviceDescription: string;

  @ApiPropertyOptional({ example: '2025-09-15T09:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  eventDate?: Date;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;

  @ApiPropertyOptional({ example: 'Victoria Island, Lagos' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 250000, description: 'Initial quote amount in minor/major units' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialQuote?: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'No pork, nut-free kitchen required' })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}
