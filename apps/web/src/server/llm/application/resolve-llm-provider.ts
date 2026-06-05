import { ValidationError } from "../../shared/errors/domain-error";
import {
  findProviderInfo,
  isKnownModel,
  type LlmCredentialResolver,
  type LlmProvider,
} from "../../shared/llm";
import type { LlmProviderRegistry } from "../infrastructure/provider-registry";

export interface ResolveLlmProviderInput {
  userId: string;
  providerId: string;
  /** Omit to use the provider's catalog default. */
  modelId?: string;
}

export interface ResolvedLlm {
  provider: LlmProvider;
  /** The model id the caller should pass to `complete` (validated). */
  modelId: string;
}

/**
 * Turn a (provider, model) request + a user into a ready-to-call provider:
 *   validate provider/model against the catalog
 *   → resolve the credential (BYOK)
 *   → build the provider via the registry.
 *
 * Throws `ValidationError` (→ BAD_REQUEST) when the provider/model is
 * unknown or no credential is connected — the FE turns that into "키를
 * 연결하거나 프롬프트 복사를 사용하세요". This use case is the ONLY thing
 * task-running routers need from the `llm` context.
 */
export class ResolveLlmProviderUseCase {
  constructor(
    private readonly resolver: LlmCredentialResolver,
    private readonly registry: LlmProviderRegistry,
  ) {}

  async execute(input: ResolveLlmProviderInput): Promise<ResolvedLlm> {
    const info = findProviderInfo(input.providerId);
    if (!info) {
      throw new ValidationError(
        `지원하지 않는 provider입니다: ${input.providerId}`,
      );
    }

    const modelId = input.modelId ?? info.defaultModelId;
    if (!isKnownModel(info.id, modelId)) {
      throw new ValidationError(`${info.label}에 없는 모델입니다: ${modelId}`);
    }

    const credential = await this.resolver.resolve({
      userId: input.userId,
      providerId: info.id,
    });
    if (!credential) {
      throw new ValidationError(
        `${info.label} API 키가 연결돼 있지 않습니다. 키를 연결하거나 프롬프트 복사 방식을 사용해주세요.`,
      );
    }

    return { provider: this.registry.create(info.id, credential), modelId };
  }
}
