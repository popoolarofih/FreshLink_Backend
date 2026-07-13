import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
