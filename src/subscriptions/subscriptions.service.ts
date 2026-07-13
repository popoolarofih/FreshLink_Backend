import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { NotificationType, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Plan durations in days
const PLAN_DURATION_DAYS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]: 30,
  [SubscriptionPlan.PREMIUM]: 30,
  [SubscriptionPlan.BUSINESS]: 30,
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createOrUpgrade(userId: string, dto: CreateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });

    const durationDays = PLAN_DURATION_DAYS[dto.plan];
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    if (existing) {
      // Upgrade / extend
      return this.prisma.subscription.update({
        where: { userId },
        data: {
          plan: dto.plan,
          status: SubscriptionStatus.ACTIVE,
          startedAt: now,
          expiresAt,
          cancelledAt: null,
        },
      });
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt,
      },
    });
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No subscription found.');
    return sub;
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No subscription found.');
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled.');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────
  // Called by the BullMQ cron job
  // ─────────────────────────────────────────────

  async processRenewals() {
    const now = new Date();
    // Expire subscriptions that are past their expiry date
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { lte: now },
      },
    });

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      await this.notifications.send({
        userId: sub.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRED,
        title: 'Subscription expired',
        body: `Your ${sub.plan} plan has expired. Renew to keep access.`,
        data: { subscriptionId: sub.id },
      });
    }

    return { processed: expired.length };
  }

  async processUpcomingRenewalReminders() {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcoming = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gte: now, lte: threeDaysFromNow },
      },
    });

    for (const sub of upcoming) {
      await this.notifications.send({
        userId: sub.userId,
        type: NotificationType.SUBSCRIPTION_RENEWAL,
        title: 'Subscription expiring soon',
        body: `Your ${sub.plan} plan expires on ${sub.expiresAt.toLocaleDateString()}. Renew now to avoid interruption.`,
        data: { subscriptionId: sub.id },
      });
    }

    return { reminded: upcoming.length };
  }
}
