// ─────────────────────────────────────────────────────────────────────────────
// groq-client.service.ts
//
// Central Groq SDK wrapper. Every AI module calls through here — no other
// module imports groq-sdk directly.
//
// Features:
//   - Reads model/timeout/retry config from ConfigService at startup
//   - Exponential-backoff retry loop (configurable GROQ_MAX_RETRIES)
//   - AbortController-based timeout (GROQ_TIMEOUT_MS)
//   - Structured log on every call: model, latencyMs, token counts, context
//   - ping() for health checks — single-token call with no side effects
//   - Throws GroqUnavailableException after all retries; callers catch + fallback
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import {
  GroqChatOptions,
  GroqChatResult,
  GroqMessage,
  GroqUnavailableException,
} from './groq-client.types';

@Injectable()
export class GroqClientService implements OnModuleInit {
  private readonly logger = new Logger(GroqClientService.name);

  private readonly groq: Groq;
  private readonly modelFast: string;
  private readonly modelReasoning: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GROQ_API_KEY', '');

    this.modelFast = config.get<string>(
      'GROQ_MODEL_FAST',
      'llama-3.1-8b-instant',
    );
    this.modelReasoning = config.get<string>(
      'GROQ_MODEL_REASONING',
      'llama-3.3-70b-versatile',
    );
    this.timeoutMs = config.get<number>('GROQ_TIMEOUT_MS', 10_000);
    this.maxRetries = config.get<number>('GROQ_MAX_RETRIES', 3);

    // Disable the SDK's own retry logic — we manage retries ourselves so we
    // can log each attempt and implement proper exponential backoff.
    this.groq = new Groq({ apiKey, maxRetries: 0 });
  }

  onModuleInit() {
    if (!this.config.get<string>('GROQ_API_KEY')) {
      this.logger.warn(
        'GROQ_API_KEY is not set. All Groq calls will fail and ' +
          'services will fall back to deterministic logic.',
      );
    } else {
      this.logger.log(
        `GroqClientService ready — fast: ${this.modelFast}, ` +
          `reasoning: ${this.modelReasoning}, ` +
          `timeout: ${this.timeoutMs}ms, maxRetries: ${this.maxRetries}`,
      );
    }
  }

  // ── Public model name accessors (for callers that need to pick a model) ─────

  get fastModel(): string {
    return this.modelFast;
  }

  get reasoningModel(): string {
    return this.modelReasoning;
  }

  // ── Core chat method ─────────────────────────────────────────────────────────

  /**
   * Send a chat completion request to Groq.
   *
   * @param messages  Ordered message array (system + user turns)
   * @param options   Model override, temperature, max tokens, json mode
   * @returns         Typed result with content + telemetry fields
   * @throws          GroqUnavailableException when all retries are exhausted
   */
  async chat(
    messages: GroqMessage[],
    options: GroqChatOptions = {},
  ): Promise<GroqChatResult> {
    const model = options.model ?? this.modelReasoning;
    const temperature = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 1024;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.maxRetries) {
      attempt++;
      const started = Date.now();

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        let completion: Awaited<
          ReturnType<typeof this.groq.chat.completions.create>
        >;

        try {
          completion = await this.groq.chat.completions.create(
            {
              model,
              messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              temperature,
              max_tokens: maxTokens,
              ...(options.jsonMode
                ? { response_format: { type: 'json_object' } }
                : {}),
            },
            { signal: controller.signal },
          );
        } finally {
          clearTimeout(timer);
        }

        const latencyMs = Date.now() - started;
        const choice = completion.choices[0];
        const content = choice?.message?.content ?? '';
        const usage = completion.usage;

        const result: GroqChatResult = {
          content,
          model: completion.model,
          latencyMs,
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
        };

        // Structured log — truncate context to avoid log bloat
        this.logger.log(
          JSON.stringify({
            event: 'groq_call_success',
            model: result.model,
            latencyMs,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            attempt,
            contextPreview: this.truncateForLog(messages),
            outputPreview: content.slice(0, 200),
          }),
        );

        return result;
      } catch (err) {
        lastError = err;
        const latencyMs = Date.now() - started;
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const isTimeout = isAbort;
        const errMsg = err instanceof Error ? err.message : String(err);

        this.logger.warn(
          JSON.stringify({
            event: 'groq_call_failure',
            model,
            latencyMs,
            attempt,
            maxRetries: this.maxRetries,
            error: errMsg,
            isTimeout,
          }),
        );

        if (attempt < this.maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms …
          const backoffMs = Math.min(500 * 2 ** (attempt - 1), 8_000);
          this.logger.log(
            `Groq retry ${attempt}/${this.maxRetries} in ${backoffMs}ms…`,
          );
          await this.sleep(backoffMs);
        }
      }
    }

    throw new GroqUnavailableException(
      `Groq unavailable after ${this.maxRetries} attempts`,
      lastError,
    );
  }

  // ── Health check ping ────────────────────────────────────────────────────────

  /**
   * Fire a minimal 1-token chat completion to verify API reachability.
   * Used by the /health endpoint only.
   */
  async ping(): Promise<{
    reachable: boolean;
    model: string;
    latencyMs: number;
  }> {
    const started = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        await this.groq.chat.completions.create(
          {
            model: this.modelFast,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          },
          { signal: controller.signal },
        );
      } finally {
        clearTimeout(timer);
      }
      return {
        reachable: true,
        model: this.modelFast,
        latencyMs: Date.now() - started,
      };
    } catch {
      return {
        reachable: false,
        model: this.modelFast,
        latencyMs: Date.now() - started,
      };
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Return a concise log-safe preview of the message array.
   * Truncates individual message content to 150 chars.
   */
  private truncateForLog(
    messages: GroqMessage[],
  ): Array<{ role: string; contentPreview: string }> {
    return messages.map((m) => ({
      role: m.role,
      contentPreview: m.content.slice(0, 150),
    }));
  }
}
