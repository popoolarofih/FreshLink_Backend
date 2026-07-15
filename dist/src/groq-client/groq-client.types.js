"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqUnavailableException = void 0;
class GroqUnavailableException extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'GroqUnavailableException';
    }
}
exports.GroqUnavailableException = GroqUnavailableException;
//# sourceMappingURL=groq-client.types.js.map