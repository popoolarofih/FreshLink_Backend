import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BuyersService } from './buyers.service';

@ApiTags('Buyers')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('buyers')
export class BuyersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buyersService: BuyersService,
  ) {}

  @Get('me')
  @ApiOkResponse({
    description: "Current buyer's profile",
    schema: {
      example: {
        id: 'uuid',
        userId: 'uuid',
        companyName: "Ada's Catering Ltd",
        buyerType: 'individual',
        address: null,
        city: 'Lagos',
        country: 'NG',
        dietaryPreferences: ['vegan', 'gluten-free'],
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
        user: { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com' },
      },
    },
  })
  @Roles(Role.BUYER)
  @ApiOperation({ summary: "Get current buyer's profile" })
  async getMe(@CurrentUser() user: any) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return profile;
  }

  @Patch('me')
  @ApiOkResponse({
    description: "Updated buyer's profile",
    schema: {
      example: {
        id: 'uuid',
        userId: 'uuid',
        companyName: "Ada's Catering Ltd",
        buyerType: 'individual',
        address: null,
        city: 'Lagos',
        country: 'NG',
        dietaryPreferences: ['vegan'],
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
        user: { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com' },
      },
    },
  })
  @Roles(Role.BUYER)
  @ApiOperation({ summary: "Update current buyer's profile" })
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateBuyerProfileDto) {
    const updates: any = {};
    if (dto.city) updates.city = dto.city;
    if (dto.businessName) updates.companyName = dto.businessName;

    if (dto.fullName) {
      const [firstName, ...rest] = dto.fullName.split(' ');
      const lastName = rest.join(' ') || '';
      await this.prisma.user.update({
        where: { id: user.id },
        data: { firstName, lastName },
      });
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.buyerProfile.update({
        where: { userId: user.id },
        data: updates,
      });
    }

    if (dto.dietaryPreferences) {
      await this.prisma.buyerProfile.update({
        where: { userId: user.id },
        data: { dietaryPreferences: dto.dietaryPreferences },
      });
    }

    return this.prisma.buyerProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
  }

  @Get('me/analytics')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Get buyer spending analytics' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['30d', '90d', '12m'],
    description: 'Date range for analytics (default: 30d)',
  })
  async getAnalytics(
    @CurrentUser() user: any,
    @Query('range') range: string = '30d',
  ) {
    return this.buyersService.getAnalytics(user.id, range);
  }

  @Get('me/reorder-history')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Get providers this buyer has ordered from before' })
  async getReorderHistory(@CurrentUser() user: any) {
    return this.buyersService.getReorderHistory(user.id);
  }
}
