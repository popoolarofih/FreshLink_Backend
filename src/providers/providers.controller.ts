import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProvidersService } from './providers.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddPortfolioItemDto } from './dto/add-portfolio-item.dto';
import { AddPricingItemDto } from './dto/add-pricing-item.dto';
import { AddAvailabilitySlotDto } from './dto/add-availability-slot.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Providers')
@ApiBearerAuth('access-token')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ── Own profile ──────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get my provider profile' })
  getMyProfile(@CurrentUser() user: any) {
    return this.providersService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Update my provider profile (including tags)' })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateProfile(user.id, dto);
  }

  // ── Earnings ───────────────────────────────────────────────────────────

  @Get('me/earnings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get my earnings summary' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getEarnings(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.providersService.getEarnings(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  // ── Public profile by ID ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a provider profile by ID (public)' })
  getProfile(@Param('id') id: string) {
    return this.providersService.getProfileById(id);
  }

  // ── Portfolio ────────────────────────────────────────────────────────────

  @Post('me/portfolio')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Add a portfolio item' })
  addPortfolioItem(@CurrentUser() user: any, @Body() dto: AddPortfolioItemDto) {
    return this.providersService.addPortfolioItem(user.id, dto);
  }

  @Delete('me/portfolio/:itemId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Remove a portfolio item' })
  removePortfolioItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    return this.providersService.removePortfolioItem(user.id, itemId);
  }

  // ── Pricing ──────────────────────────────────────────────────────────────

  @Post('me/pricing')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Add a pricing item' })
  addPricingItem(@CurrentUser() user: any, @Body() dto: AddPricingItemDto) {
    return this.providersService.addPricingItem(user.id, dto);
  }

  @Delete('me/pricing/:itemId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Remove a pricing item' })
  removePricingItem(@CurrentUser() user: any, @Param('itemId') itemId: string) {
    return this.providersService.removePricingItem(user.id, itemId);
  }

  @Get('me/price-suggestion')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get price suggestions for a category' })
  getPriceSuggestion(
    @CurrentUser() user: any,
    @Query('category') category: string,
    @Query('guestCount') guestCount?: number,
    @Query('durationHours') durationHours?: number,
    @Query('eventType') eventType?: string,
  ) {
    return this.providersService.getPriceSuggestion(
      user.id,
      category,
      guestCount,
      durationHours,
      eventType,
    );
  }

  // ── Availability ─────────────────────────────────────────────────────────

  @Post('me/availability')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Add an availability slot' })
  addSlot(@CurrentUser() user: any, @Body() dto: AddAvailabilitySlotDto) {
    return this.providersService.addAvailabilitySlot(user.id, dto);
  }

  @Delete('me/availability/:slotId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Remove an availability slot' })
  removeSlot(@CurrentUser() user: any, @Param('slotId') slotId: string) {
    return this.providersService.removeAvailabilitySlot(user.id, slotId);
  }
}
