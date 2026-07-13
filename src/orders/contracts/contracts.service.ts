import { Injectable, Logger } from '@nestjs/common';
import { GroqClientService } from '../../groq-client/groq-client.service';
import {
  ContractDraft,
  OrderContext,
} from '../../groq-client/groq-client.types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  private templates: Record<string, string> = {};

  constructor(private readonly groqClient: GroqClientService) {}

  private async loadTemplate(category: string): Promise<string> {
    if (this.templates[category]) return this.templates[category];
    try {
      const filePath = path.join(
        process.cwd(),
        'prompts',
        'contracts',
        `${category}.prompt.txt`,
      );
      const content = await fs.readFile(filePath, 'utf8');
      this.templates[category] = content;
      return content;
    } catch (err) {
      this.logger.error(`Failed to load contract template for ${category}: ${err}`);
      return 'Generate contract draft.';
    }
  }

  private replacePlaceholders(template: string, context: OrderContext): string {
    let result = template;
    const values: Record<string, string> = {
      buyerName: context.buyerName || 'Buyer',
      providerName: context.providerName || 'Provider',
      serviceDescription: context.serviceDescription || 'No description provided',
      eventDate: context.eventDate || 'N/A',
      agreedPrice: context.agreedPrice ? String(context.agreedPrice) : 'N/A',
      currency: context.currency || 'NGN',
      guestCount: context.guestCount ? String(context.guestCount) : 'N/A',
      specialRequirements: context.specialRequirements || 'None',
    };

    for (const [key, val] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val);
    }
    return result;
  }

  async generateContract(context: OrderContext): Promise<ContractDraft> {
    const fallbackTitle = `Service Agreement – Order ${context.orderId}`;
    const fallbackSections = [
      {
        title: '1. Parties and Description',
        content: `This agreement is between ${context.buyerName} (Buyer) and ${context.providerName} (Provider) for: "${context.serviceDescription}".`,
      },
      {
        title: '2. Payment Terms',
        content: context.agreedPrice
          ? `Agreed Price: ${context.agreedPrice} ${context.currency ?? 'NGN'}`
          : 'Price to be determined.',
      },
      {
        title: '3. Event Date / Schedule',
        content: context.eventDate ? `Date: ${context.eventDate}` : 'Date: N/A',
      },
      {
        title: '4. Standard Cancellation Policy',
        content: 'Cancellation within 48 hours of service start is subject to a 50% penalty.',
      },
      {
        title: '5. Dispute Resolution',
        content: 'Any dispute arising under this agreement will be mediated via the FreshLink platform.',
      },
    ];

    try {
      const template = await this.loadTemplate(context.category);
      const promptContent = this.replacePlaceholders(template, context);

      const response = await this.groqClient.chat(
        [
          { role: 'system', content: 'You are an AI assistant drafting contracts in JSON mode.' },
          { role: 'user', content: promptContent },
        ],
        {
          model: this.groqClient.reasoningModel, // quality-critical -> reasoning model
          temperature: 0.2,
          jsonMode: true,
        },
      );

      const parsed = JSON.parse(response.content);

      // Perform a rule check alongside LLM output
      const flags: string[] = parsed.flags || [];

      // TS rule check checks:
      if (context.specialRequirements && context.specialRequirements.toLowerCase().includes('no cancellation')) {
        flags.push('Contract prohibits cancellations completely, deviating from standard platform terms.');
      }

      return {
        title: parsed.title || fallbackTitle,
        sections: parsed.sections || fallbackSections,
        generatedAt: new Date().toISOString(),
        flags,
        aiFallback: false,
      };
    } catch (err) {
      this.logger.warn(
        `ContractsService fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`,
      );
      return {
        title: fallbackTitle,
        sections: fallbackSections,
        generatedAt: new Date().toISOString(),
        flags: ['fallback:standard-platform-contract-used'],
        aiFallback: true,
      };
    }
  }
}
