import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class AddAvailabilitySlotDto {
  @ApiProperty({ example: '2025-09-15T09:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({ example: '2025-09-15T17:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endTime: Date;
}
