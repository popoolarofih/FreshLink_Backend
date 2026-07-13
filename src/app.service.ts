import { Injectable } from '@nestjs/common';
import { GroqClientService } from './groq-client/groq-client.service';

@Injectable()
export class AppService {
  constructor(private readonly groqClient: GroqClientService) {}

  async getHealth(): Promise<Record<string, unknown>> {
    const groq = await this.groqClient.ping();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      groq,
    };
  }
}
