import type { LlmPrompt } from "./llm-task";

/**
 * Provider abstraction — the outbound port a *server-side* LLM run calls.
 *
 * The manual (copy-prompt → paste-response) flow never touches this; it
 * only uses `LlmTask.buildPrompt` / `parseResponse`. This port is the OTHER
 * half: "생성하기" 버튼이 서버에서 직접 모델을 호출하는 경로.
 *
 * Design goals:
 *   - swap providers freely (Anthropic ↔ OpenAI ↔ …) behind one interface
 *   - pick a model per request (`LlmCompletionOptions.model`)
 *   - keep the credential OUT of the call site — a provider is built WITH a
 *     credential (see `LlmProviderFactory`), so `complete` carries only the
 *     request. BYOK: where the credential comes from is the resolver's job
 *     (`./credential`), env today, per-user store later.
 */

/** Identifies exactly which model to call: provider + that provider's model id. */
export interface LlmModelRef {
  providerId: string;
  modelId: string;
}

/** Per-request knobs. All optional — a provider supplies its own defaults. */
export interface LlmCompletionOptions {
  /** Provider model id (e.g. "claude-sonnet-4-6"). Omit → provider default. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** What a provider returns. `text` is all a task parses today; `model`/`usage`
 * are surfaced for telemetry/cost without forcing callers to change. */
export interface LlmCompletionResult {
  text: string;
  /** The model the provider actually used (echoed back). */
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/** A provider-specific secret. Minimal on purpose — just the key. The
 * resolver decides its origin; the registry turns it into a live provider. */
export interface LlmCredential {
  apiKey: string;
}

/**
 * One model provider (Anthropic, OpenAI, …). Constructed with a credential,
 * so it can be `new`-ed per request once the key is resolved.
 */
export interface LlmProvider {
  /** Stable provider id, e.g. "anthropic". Matches the catalog. */
  readonly id: string;
  /** Model used when a request omits `options.model`. */
  readonly defaultModel: string;
  complete(
    prompt: LlmPrompt,
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult>;
}

/** Builds a live provider from a credential. One per provider kind; the
 * registry (`llm` context) holds the map id → factory. */
export type LlmProviderFactory = (credential: LlmCredential) => LlmProvider;
