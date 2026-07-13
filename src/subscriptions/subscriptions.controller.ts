import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or upgrade subscription' })
  createOrUpgrade(@CurrentUser() user: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createOrUpgrade(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my current subscription' })
  getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Cancel my subscription' })
  cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }
}
