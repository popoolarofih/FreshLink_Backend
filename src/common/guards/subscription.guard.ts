import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Attach @UseGuards(SubscriptionGuard) on routes that require an active subscription.
 * The JWT guard must run first so request.user is populated.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const sub = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException(
        'An active subscription is required to access this resource.',
      );
    }

    return true;
  }
}
