import { ValidationError } from "../../shared/errors/domain-error";
import type {
  LlmCredential,
  LlmProvider,
  LlmProviderFactory,
} from "../../shared/llm";
import { AnthropicProvider } from "./providers/anthropic-provider";
import { OpenAIProvider } from "./providers/openai-provider";

/**
 * Maps a provider id → a factory that turns a credential into a live
 * provider. This is the single place that knows which concrete adapter
 * backs each id; adding a provider = one entry here + a catalog row.
 *
 * Application code never imports a concrete adapter — it asks the registry,
 * so providers stay swappable behind the `LlmProvider` port.
 */
const FACTORIES: Record<string, LlmProviderFactory> = {
  anthropic: (credential) => new AnthropicProvider(credential),
  openai: (credential) => new OpenAIProvider(credential),
};

export class LlmProviderRegistry {
  has(providerId: string): boolean {
    return providerId in FACTORIES;
  }

  create(providerId: string, credential: LlmCredential): LlmProvider {
    const factory = FACTORIES[providerId];
    if (!factory) {
      throw new ValidationError(`등록되지 않은 provider입니다: ${providerId}`);
    }
    return factory(credential);
  }
}
