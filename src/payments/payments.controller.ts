import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Initiate payment for a confirmed order (returns Stripe clientSecret)' })
  initiatePayment(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.initiatePayment(user.id, dto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payment record for an order' })
  getPayment(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrder(orderId, user.id);
  }

  @Post('order/:orderId/release')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Release held funds after confirming delivery' })
  releaseFunds(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.paymentsService.releaseFunds(orderId, user.id);
  }

  @Post('order/:orderId/refund')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Refund a held payment' })
  refund(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.paymentsService.refund(orderId, user.id);
  }
}
