// ─────────────────────────────────────────────────────────────────────────────
// groq-client.module.ts
//
// @Global so GroqClientService is available everywhere without each consuming
// module needing to import GroqClientModule explicitly — same convention as
// the existing AiClientModule it replaces.
// ─────────────────────────────────────────────────────────────────────────────

import { Global, Module } from '@nestjs/common';
import { GroqClientService } from './groq-client.service';

@Global()
@Module({
  providers: [GroqClientService],
  exports: [GroqClientService],
})
export class GroqClientModule {}
