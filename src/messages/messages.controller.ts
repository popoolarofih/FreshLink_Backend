import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
import {
  MessageListResponseDto,
  MessageResponseDto,
} from './dto/message-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('orders/:orderId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ─────────────────────────────────────────────
  // POST /orders/:orderId/messages
  // ─────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Send a message on an order thread' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOkResponse({ type: MessageResponseDto })
  sendMessage(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(orderId, user.id, dto);
  }

  // ─────────────────────────────────────────────
  // GET /orders/:orderId/messages
  // ─────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List messages for an order thread',
    description:
      'Returns messages oldest-first (createdAt ASC). ' +
      'Paginate with `page` and `limit`. ' +
      'Each message includes `readAt` (null = unread by the recipient).',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOkResponse({ type: MessageListResponseDto })
  listMessages(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Query() query: ListMessagesDto,
  ) {
    return this.messagesService.listMessages(orderId, user.id, query);
  }

  // ─────────────────────────────────────────────
  // PATCH /orders/:orderId/messages/read
  // ─────────────────────────────────────────────

  @Patch('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Mark all of the other party's messages as read",
    description:
      'Sets readAt = now() on every message in this order thread that was NOT sent by the caller and has readAt = null. ' +
      'Returns the number of messages marked.',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  markRead(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.messagesService.markThreadRead(orderId, user.id);
  }
}
