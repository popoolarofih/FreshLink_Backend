import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeProvider } from './providers/stripe.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { NotificationType, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly stripe: StripeProvider,
  ) {}

  // ─────────────────────────────────────────────
  // Initiate payment (create PaymentIntent, hold funds)
  // ─────────────────────────────────────────────

  async initiatePayment(buyerId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true, providerProfile: { include: { user: true } } },
    });

    if (!order) throw new NotFoundException('Order not found.');
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.payment) throw new BadRequestException('Payment already initiated.');

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.CONTRACT_SIGNED
    ) {
      throw new BadRequestException(
        'Payment can only be initiated for CONFIRMED or CONTRACT_SIGNED orders.',
      );
    }

    const amount = Number(order.agreedPrice ?? order.initialQuote ?? 0);
    if (amount <= 0) {
      throw new BadRequestException('Order has no agreed or quoted price.');
    }

    // Stripe uses smallest currency unit — multiply by 100 for NGN kobo
    const result = await this.stripe.createPaymentIntent({
      amount: Math.round(amount * 100),
      currency: order.currency ?? 'NGN',
      orderId: order.id,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount,
        currency: order.currency ?? 'NGN',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: result.providerIntentId,
        provider: 'stripe',
      },
    });

    return { payment, clientSecret: result.clientSecret };
  }

  // ─────────────────────────────────────────────
  // Webhook: mark as HELD once Stripe confirms card charged
  // ─────────────────────────────────────────────

  async markHeld(stripePaymentIntentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId },
    });
    if (!payment) return; // not our record

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.HELD, heldAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────
  // Release funds (buyer confirms delivery)
  // Only callable after order = DELIVERED
  // ─────────────────────────────────────────────

  async releaseFunds(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, providerProfile: { include: { user: true } } },
    });

    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Funds can only be released once the order is DELIVERED.');
    }

    const payment = order.payment;
    if (!payment) throw new NotFoundException('No payment record found.');
    if (payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('Payment is not in HELD state.');
    }

    // Capture the Stripe payment intent (move money from hold to capture)
    const captureResult = await this.stripe.capturePayment(
      payment.stripePaymentIntentId!,
    );

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.RELEASED,
        stripeChargeId: captureResult.providerChargeId,
        releasedAt: new Date(),
      },
    });

    await this.notifications.send({
      userId: order.providerProfile.user.id,
      type: NotificationType.PAYMENT_UPDATE,
      title: 'Payment released',
      body: `${order.currency} ${payment.amount} has been released to your account.`,
      data: { orderId },
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // Refund
  // ─────────────────────────────────────────────

  async refund(orderId: string, requesterId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException();
    if (order.buyerId !== requesterId) throw new ForbiddenException();

    const payment = order.payment;
    if (!payment || payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('Refunds can only be issued on HELD payments.');
    }

    const refundResult = await this.stripe.refundPayment(
      payment.stripeChargeId ?? payment.stripePaymentIntentId!,
    );

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return { payment: updated, refundId: refundResult.refundId };
  }

  async getPaymentByOrder(orderId: string, requesterId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, providerProfile: true },
    });
    if (!order) throw new NotFoundException();

    const isOwner =
      order.buyerId === requesterId || order.providerProfile.userId === requesterId;
    if (!isOwner) throw new ForbiddenException();

    return order.payment;
  }
}
