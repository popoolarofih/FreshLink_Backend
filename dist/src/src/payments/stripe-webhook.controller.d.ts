import { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
export declare class StripeWebhookController {
    private readonly paymentsService;
    private readonly config;
    private readonly logger;
    private readonly stripe;
    private readonly webhookSecret;
    constructor(paymentsService: PaymentsService, config: ConfigService);
    handleWebhook(req: RawBodyRequest<Request>, sig: string): Promise<{
        received: boolean;
    }>;
}
