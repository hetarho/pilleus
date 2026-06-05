/**
 * Declarative catalog of providers + models. PURE DATA — no I/O, safe to
 * ship to the FE (the model picker reads it). Adding a provider/model is a
 * one-line edit here; nothing else in the kernel needs to change.
 *
 * `envVar` is read by the dev-mode credential resolver (`llm` context). When
 * per-user keys land, that column is irrelevant to the store-backed resolver
 * but stays useful for local development.
 */

export type LlmProviderId = "anthropic" | "openai";

export interface LlmModelInfo {
  /** Model id sent to the provider API, e.g. "claude-sonnet-4-6". */
  id: string;
  /** Human label shown in the picker. */
  label: string;
}

export interface LlmProviderInfo {
  id: LlmProviderId;
  label: string;
  /** Env var the dev resolver reads for this provider's key. */
  envVar: string;
  /** Model used when a request doesn't pick one. */
  defaultModelId: string;
  models: readonly LlmModelInfo[];
}

export const LLM_CATALOG: readonly LlmProviderInfo[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    envVar: "ANTHROPIC_API_KEY",
    defaultModelId: "claude-sonnet-4-6",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    envVar: "OPENAI_API_KEY",
    defaultModelId: "gpt-4.1",
    models: [
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-4o", label: "GPT-4o" },
    ],
  },
];

export function findProviderInfo(id: string): LlmProviderInfo | undefined {
  return LLM_CATALOG.find((p) => p.id === id);
}

/** True if `modelId` is a model the given provider declares. The resolver
 * rejects unknown models so a typo can't reach a provider API. */
export function isKnownModel(providerId: string, modelId: string): boolean {
  return findProviderInfo(providerId)?.models.some((m) => m.id === modelId) ?? false;
}
