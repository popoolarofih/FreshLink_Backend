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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const counter_offer_dto_1 = require("./dto/counter-offer.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(user, dto) {
        return this.ordersService.createOrder(user.id, dto);
    }
    getBuyerOrders(user, page = 1, limit = 20) {
        return this.ordersService.getBuyerOrders(user.id, Number(page), Number(limit));
    }
    getProviderOrders(user, page = 1, limit = 20) {
        return this.ordersService.getProviderOrders(user.id, Number(page), Number(limit));
    }
    getOne(user, id) {
        return this.ordersService.getOrderById(id, user.id, user.role);
    }
    updateStatus(user, id, dto) {
        return this.ordersService.updateStatus(id, user.id, user.role, dto);
    }
    counterOffer(user, id, dto) {
        return this.ordersService.submitCounterOffer(id, user.id, dto);
    }
    acceptCounterOffer(user, id) {
        return this.ordersService.acceptCounterOffer(id, user.id);
    }
    contractDraft(user, id) {
        return this.ordersService.requestContractDraft(id, user.id);
    }
    signContract(user, id) {
        return this.ordersService.signContract(id, user.id, user.role);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.BUYER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a booking / quote request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine/buyer'),
    (0, roles_decorator_1.Roles)(client_1.Role.BUYER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my orders as a buyer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getBuyerOrders", null);
__decorate([
    (0, common_1.Get)('mine/provider'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my orders as a provider' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getProviderOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single order (buyer, provider, or admin)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Advance order status (state machine enforced)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/counter-offer'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a counter-offer (provider only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, counter_offer_dto_1.CounterOfferDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "counterOffer", null);
__decorate([
    (0, common_1.Post)(':id/accept-counter-offer'),
    (0, roles_decorator_1.Roles)(client_1.Role.BUYER),
    (0, swagger_1.ApiOperation)({ summary: 'Accept the provider counter-offer' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "acceptCounterOffer", null);
__decorate([
    (0, common_1.Get)(':id/contract-draft'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI-generated contract draft for an order' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "contractDraft", null);
__decorate([
    (0, common_1.Post)(':id/contract/sign'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign the contract for an order (buyer or provider)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "signContract", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map