"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const messages_service_1 = require("./messages.service");
const create_message_dto_1 = require("./dto/create-message.dto");
const list_messages_dto_1 = require("./dto/list-messages.dto");
const message_response_dto_1 = require("./dto/message-response.dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    sendMessage(user, orderId, dto) {
        return this.messagesService.sendMessage(orderId, user.id, dto);
    }
    listMessages(user, orderId, query) {
        return this.messagesService.listMessages(orderId, user.id, query);
    }
    markRead(user, orderId) {
        return this.messagesService.markThreadRead(orderId, user.id);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message on an order thread' }),
    (0, swagger_1.ApiParam)({ name: 'orderId', description: 'Order ID' }),
    (0, swagger_1.ApiOkResponse)({ type: message_response_dto_1.MessageResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List messages for an order thread',
        description: 'Returns messages oldest-first (createdAt ASC). ' +
            'Paginate with `page` and `limit`. ' +
            'Each message includes `readAt` (null = unread by the recipient).',
    }),
    (0, swagger_1.ApiParam)({ name: 'orderId', description: 'Order ID' }),
    (0, swagger_1.ApiOkResponse)({ type: message_response_dto_1.MessageListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, list_messages_dto_1.ListMessagesDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Patch)('read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: "Mark all of the other party's messages as read",
        description: 'Sets readAt = now() on every message in this order thread that was NOT sent by the caller and has readAt = null. ' +
            'Returns the number of messages marked.',
    }),
    (0, swagger_1.ApiParam)({ name: 'orderId', description: 'Order ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "markRead", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('Messages'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('orders/:orderId/messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map