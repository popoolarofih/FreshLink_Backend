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
exports.ProvidersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const providers_service_1 = require("./providers.service");
const update_provider_profile_dto_1 = require("./dto/update-provider-profile.dto");
const add_portfolio_item_dto_1 = require("./dto/add-portfolio-item.dto");
const add_pricing_item_dto_1 = require("./dto/add-pricing-item.dto");
const add_availability_slot_dto_1 = require("./dto/add-availability-slot.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ProvidersController = class ProvidersController {
    constructor(providersService) {
        this.providersService = providersService;
    }
    getMyProfile(user) {
        return this.providersService.getProfile(user.id);
    }
    updateMyProfile(user, dto) {
        return this.providersService.updateProfile(user.id, dto);
    }
    getProfile(id) {
        return this.providersService.getProfileById(id);
    }
    addPortfolioItem(user, dto) {
        return this.providersService.addPortfolioItem(user.id, dto);
    }
    removePortfolioItem(user, itemId) {
        return this.providersService.removePortfolioItem(user.id, itemId);
    }
    addPricingItem(user, dto) {
        return this.providersService.addPricingItem(user.id, dto);
    }
    removePricingItem(user, itemId) {
        return this.providersService.removePricingItem(user.id, itemId);
    }
    getPriceSuggestion(user, category, guestCount, durationHours, eventType) {
        return this.providersService.getPriceSuggestion(user.id, category, guestCount, durationHours, eventType);
    }
    addSlot(user, dto) {
        return this.providersService.addAvailabilitySlot(user.id, dto);
    }
    removeSlot(user, slotId) {
        return this.providersService.removeAvailabilitySlot(user.id, slotId);
    }
};
exports.ProvidersController = ProvidersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my provider profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Update my provider profile (including tags)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_provider_profile_dto_1.UpdateProviderProfileDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a provider profile by ID (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('me/portfolio'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Add a portfolio item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_portfolio_item_dto_1.AddPortfolioItemDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "addPortfolioItem", null);
__decorate([
    (0, common_1.Delete)('me/portfolio/:itemId'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a portfolio item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "removePortfolioItem", null);
__decorate([
    (0, common_1.Post)('me/pricing'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Add a pricing item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_pricing_item_dto_1.AddPricingItemDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "addPricingItem", null);
__decorate([
    (0, common_1.Delete)('me/pricing/:itemId'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a pricing item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "removePricingItem", null);
__decorate([
    (0, common_1.Get)('me/price-suggestion'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Get price suggestions for a category' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('guestCount')),
    __param(3, (0, common_1.Query)('durationHours')),
    __param(4, (0, common_1.Query)('eventType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number, String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getPriceSuggestion", null);
__decorate([
    (0, common_1.Post)('me/availability'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Add an availability slot' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_availability_slot_dto_1.AddAvailabilitySlotDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "addSlot", null);
__decorate([
    (0, common_1.Delete)('me/availability/:slotId'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROVIDER),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an availability slot' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('slotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "removeSlot", null);
exports.ProvidersController = ProvidersController = __decorate([
    (0, swagger_1.ApiTags)('Providers'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('providers'),
    __metadata("design:paramtypes", [providers_service_1.ProvidersService])
], ProvidersController);
//# sourceMappingURL=providers.controller.js.map