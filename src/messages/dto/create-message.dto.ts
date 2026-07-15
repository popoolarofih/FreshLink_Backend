import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Can you confirm the delivery time for the event?' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}
