import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CounterOfferDto {
  @ApiProperty({ example: 180000 })
  @IsNumber()
  @Min(0)
  amount: number;
}
