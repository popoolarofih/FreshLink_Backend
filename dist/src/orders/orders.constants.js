"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_TRANSITIONS = exports.ORDERS_QUEUE = void 0;
const client_1 = require("@prisma/client");
exports.ORDERS_QUEUE = 'orders';
exports.ORDER_TRANSITIONS = {
    [client_1.OrderStatus.REQUESTED]: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.CONFIRMED]: [client_1.OrderStatus.CONTRACT_SIGNED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.CONTRACT_SIGNED]: [client_1.OrderStatus.IN_PROGRESS, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.IN_PROGRESS]: [client_1.OrderStatus.DELIVERED],
    [client_1.OrderStatus.DELIVERED]: [client_1.OrderStatus.REVIEWED],
    [client_1.OrderStatus.REVIEWED]: [],
    [client_1.OrderStatus.CANCELLED]: [],
};
//# sourceMappingURL=orders.constants.js.map