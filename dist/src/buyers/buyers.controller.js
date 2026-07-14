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
exports.BuyersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const update_buyer_profile_dto_1 = require("./dto/update-buyer-profile.dto");
const prisma_service_1 = require("../prisma/prisma.service");
let BuyersController = class BuyersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(user) {
        const profile = await this.prisma.buyerProfile.findUnique({
            where: { userId: user.id },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        return profile;
    }
    async updateMe(user, dto) {
        const updates = {};
        if (dto.city)
            updates.city = dto.city;
        if (dto.businessName)
            updates.companyName = dto.businessName;
        if (dto.fullName) {
            const [firstName, ...rest] = dto.fullName.split(' ');
            const lastName = rest.join(' ') || '';
            await this.prisma.user.update({ where: { id: user.id }, data: { firstName, lastName } });
        }
        if (Object.keys(updates).length > 0) {
            await this.prisma.buyerProfile.update({ where: { userId: user.id }, data: updates });
        }
        if (dto.dietaryPreferences) {
            await this.prisma.buyerProfile.update({ where: { userId: user.id }, data: { dietaryPreferences: dto.dietaryPreferences } });
        }
        return this.prisma.buyerProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
    }
};
exports.BuyersController = BuyersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOkResponse)({
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
    }),
    (0, roles_decorator_1.Roles)(client_1.Role.BUYER),
    (0, swagger_1.ApiOperation)({ summary: "Get current buyer's profile" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOkResponse)({
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
    }),
    (0, roles_decorator_1.Roles)(client_1.Role.BUYER),
    (0, swagger_1.ApiOperation)({ summary: "Update current buyer's profile" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_buyer_profile_dto_1.UpdateBuyerProfileDto]),
    __metadata("design:returntype", Promise)
], BuyersController.prototype, "updateMe", null);
exports.BuyersController = BuyersController = __decorate([
    (0, swagger_1.ApiTags)('Buyers'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('buyers'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuyersController);
//# sourceMappingURL=buyers.controller.js.map