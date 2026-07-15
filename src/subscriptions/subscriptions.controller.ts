import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans (public)' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create or upgrade subscription' })
  createOrUpgrade(
    @CurrentUser() user: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createOrUpgrade(user.id, dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get my current subscription' })
  getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Delete('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancel my subscription' })
  cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }
}
