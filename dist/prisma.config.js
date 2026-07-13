"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: process.env['DATABASE_URL'],
        adapter: () => new adapter_pg_1.PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
    },
});
//# sourceMappingURL=prisma.config.js.map