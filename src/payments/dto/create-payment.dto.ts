import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to pay for' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ enum: ['stripe'], default: 'stripe', description: 'flutterwave coming soon' })
  @IsOptional()
  @IsString()
  provider?: string;
}
