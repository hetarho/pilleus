import { LLM_CATALOG, type LlmCredentialResolver } from "../../shared/llm";

export interface LlmModelOption {
  id: string;
  label: string;
}

export interface LlmProviderAvailability {
  id: string;
  label: string;
  defaultModelId: string;
  models: LlmModelOption[];
  /** True if a credential is connected for this provider right now. The FE
   * disables server-run for unavailable providers and points the user at
   * the copy-prompt flow (or the future key-connection settings). */
  available: boolean;
}

/**
 * The model catalog, annotated with per-provider credential availability for
 * the current user. Drives the FE model picker: which providers/models exist,
 * and which can actually run server-side today.
 */
export class GetLlmCatalogUseCase {
  constructor(private readonly resolver: LlmCredentialResolver) {}

  async execute(input: { userId: string }): Promise<LlmProviderAvailability[]> {
    return Promise.all(
      LLM_CATALOG.map(async (p) => ({
        id: p.id,
        label: p.label,
        defaultModelId: p.defaultModelId,
        models: p.models.map((m) => ({ id: m.id, label: m.label })),
        available:
          (await this.resolver.resolve({
            userId: input.userId,
            providerId: p.id,
          })) != null,
      })),
    );
  }
}
