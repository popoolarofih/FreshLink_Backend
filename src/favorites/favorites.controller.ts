import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':providerProfileId')
  @ApiOperation({ summary: 'Favorite a provider (idempotent)' })
  @ApiParam({ name: 'providerProfileId', type: String })
  add(
    @CurrentUser() user: any,
    @Param('providerProfileId') providerProfileId: string,
  ) {
    return this.favoritesService.add(user.id, providerProfileId);
  }

  @Delete(':providerProfileId')
  @ApiOperation({ summary: 'Unfavorite a provider (idempotent)' })
  @ApiParam({ name: 'providerProfileId', type: String })
  remove(
    @CurrentUser() user: any,
    @Param('providerProfileId') providerProfileId: string,
  ) {
    return this.favoritesService.remove(user.id, providerProfileId);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my favorited providers' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  listMine(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.listMine(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
