import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Create a booking / quote request' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('mine/buyer')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Get my orders as a buyer' })
  getBuyerOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getBuyerOrders(user.id, Number(page), Number(limit));
  }

  @Get('mine/provider')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get my orders as a provider' })
  getProviderOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getProviderOrders(user.id, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order (buyer, provider, or admin)' })
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, user.id, user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Advance order status (state machine enforced)' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.id, user.role, dto);
  }

  @Post(':id/counter-offer')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Submit a counter-offer (provider only)' })
  counterOffer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.ordersService.submitCounterOffer(id, user.id, dto);
  }

  @Post(':id/accept-counter-offer')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Accept the provider counter-offer' })
  acceptCounterOffer(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.acceptCounterOffer(id, user.id);
  }

  @Get(':id/contract-draft')
  @ApiOperation({ summary: 'Get AI-generated contract draft for an order' })
  contractDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.requestContractDraft(id, user.id);
  }
}
