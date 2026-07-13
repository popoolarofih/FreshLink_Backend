import { Injectable, Logger } from '@nestjs/common';
import { GroqClientService } from '../../groq-client/groq-client.service';
import {
  BuyerContext,
  CandidateProvider,
  RankedProvider,
} from '../../groq-client/groq-client.types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private systemPrompt = '';

  constructor(private readonly groqClient: GroqClientService) {}

  private async loadSystemPrompt(): Promise<string> {
    if (this.systemPrompt) return this.systemPrompt;
    try {
      const filePath = path.join(
        process.cwd(),
        'prompts',
        'matchmaking.prompt.txt',
      );
      this.systemPrompt = await fs.readFile(filePath, 'utf8');
      return this.systemPrompt;
    } catch (err) {
      this.logger.error(`Failed to load matchmaking prompt: ${err}`);
      return 'Rank these food providers and give a one-sentence reasoning.';
    }
  }

  /**
   * Computes a deterministic baseline score (0-100) in plain TypeScript.
   */
  private calculateDeterministicScore(
    buyer: BuyerContext,
    provider: CandidateProvider,
  ): number {
    let score = 0;
    let totalWeight = 0;

    // 1. Proximity / City Match (Weight: 25)
    totalWeight += 25;
    if (buyer.location && provider.city) {
      if (buyer.location.toLowerCase() === provider.city.toLowerCase()) {
        score += 25;
      }
    } else if (provider.distanceKm !== undefined) {
      // Closer distance = higher score
      const distScore = Math.max(0, 100 - provider.distanceKm * 5); // 0 score at 20km
      score += (distScore / 100) * 25;
    } else {
      score += 15; // default moderate score if location is unknown
    }

    // 2. Rating (Weight: 25)
    totalWeight += 25;
    const ratingScore = Math.min(100, Math.max(0, provider.averageRating * 20)); // scale 0-5 to 0-100
    score += (ratingScore / 100) * 25;

    // 3. Price match (Weight: 20)
    totalWeight += 20;
    if (buyer.budget && provider.basePrice) {
      if (provider.basePrice <= buyer.budget) {
        score += 20;
      } else {
        const overBudgetRatio = provider.basePrice / buyer.budget;
        const pricePenalty = Math.max(0, 20 - (overBudgetRatio - 1) * 20); // penalize if over budget
        score += pricePenalty;
      }
    } else {
      score += 15; // default moderate score
    }

    // 4. Specialty / Tags Match (Weight: 20)
    totalWeight += 20;
    const providerTags = provider.tags || [];
    const buyerTags = [
      ...(buyer.preferences || []),
      ...(buyer.dietaryTags || []),
      ...(buyer.cuisineTags || []),
    ];

    if (buyerTags.length > 0 && providerTags.length > 0) {
      const matchCount = providerTags.filter((t) =>
        buyerTags.some((bt) => bt.toLowerCase() === t.toLowerCase()),
      ).length;
      const tagMatchScore = Math.min(100, (matchCount / buyerTags.length) * 100);
      score += (tagMatchScore / 100) * 20;
    } else {
      score += 10; // default moderate score
    }

    // 5. Response Rate / Availability (Weight: 10)
    totalWeight += 10;
    const responseRate = provider.responseRate ?? 100; // default 100%
    score += (responseRate / 100) * 10;

    return Math.round((score / totalWeight) * 100);
  }

  async rankProviders(
    buyerContext: BuyerContext,
    candidateProviders: CandidateProvider[],
  ): Promise<RankedProvider[]> {
    if (candidateProviders.length === 0) {
      return [];
    }

    // Step 1: Calculate deterministic baseline scores
    const candidatesWithDeterministicScores = candidateProviders.map((p) => {
      const detScore = this.calculateDeterministicScore(buyerContext, p);
      return {
        ...p,
        deterministicScore: detScore,
        score: detScore, // fallback score
        reasoning: 'fallback:deterministic',
      };
    });

    // Sort by deterministic score descending
    candidatesWithDeterministicScores.sort(
      (a, b) => b.deterministicScore - a.deterministicScore,
    );

    // If Groq API key is not set or we choose not to call it (e.g. 0 candidates), return deterministic directly
    if (candidatesWithDeterministicScores.length === 0) {
      return [];
    }

    // Step 2: Send top N (e.g., top 5) candidates to Groq for re-ranking and reasoning annotations
    const topNCount = 5;
    const topCandidates = candidatesWithDeterministicScores.slice(0, topNCount);
    const restCandidates = candidatesWithDeterministicScores.slice(topNCount);

    try {
      const systemPrompt = await this.loadSystemPrompt();
      const userMessage = {
        buyerContext,
        candidates: topCandidates.map((c) => ({
          id: c.id,
          category: c.category,
          averageRating: c.averageRating,
          city: c.city,
          basePrice: c.basePrice,
          tags: c.tags,
          deterministicScore: c.deterministicScore,
        })),
      };

      const response = await this.groqClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userMessage) },
        ],
        {
          model: this.groqClient.fastModel, // use the fast model for latencies
          temperature: 0.2,
          jsonMode: true,
        },
      );

      const parsed = JSON.parse(response.content);
      const rankedMap = new Map<string, { score: number; reasoning: string }>();

      if (parsed && Array.isArray(parsed.rankedProviders)) {
        for (const item of parsed.rankedProviders) {
          rankedMap.set(item.id, {
            score: item.score,
            reasoning: item.reasoning,
          });
        }
      }

      // Re-map the top candidates with Groq annotations
      const reRankedTop = topCandidates.map((c) => {
        const groqResult = rankedMap.get(c.id);
        if (groqResult) {
          return {
            ...c,
            score: groqResult.score,
            reasoning: groqResult.reasoning,
            aiFallback: false,
          };
        }
        return c; // keep deterministic baseline if not annotated
      });

      // Merge back top and rest, then sort by final score descending
      const finalResults = [...reRankedTop, ...restCandidates].sort(
        (a, b) => b.score - a.score,
      );
      return finalResults;
    } catch (err) {
      // Log warning flag when fallback happens
      this.logger.warn(
        `Matchmaking fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`,
      );

      // Return the deterministic ranking for all
      return candidatesWithDeterministicScores.map((c) => ({
        ...c,
        aiFallback: true,
      }));
    }
  }
}
