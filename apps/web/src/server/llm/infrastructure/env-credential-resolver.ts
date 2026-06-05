import {
  findProviderInfo,
  type LlmCredential,
  type LlmCredentialResolver,
} from "../../shared/llm";

/**
 * Dev-mode credential resolver: reads the provider's key from `process.env`
 * (the `envVar` declared in the catalog). The key is shared, so `userId` is
 * ignored.
 *
 * This is the temporary BYOK adapter. When keys are connected per-user in
 * "내 정보 관리", add a `StoreCredentialResolver` that reads the user's
 * stored key and swap it in at the composition root (the routers). Nothing
 * upstream changes — both implement `LlmCredentialResolver`.
 */
export class EnvCredentialResolver implements LlmCredentialResolver {
  async resolve({
    providerId,
  }: {
    userId: string;
    providerId: string;
  }): Promise<LlmCredential | null> {
    const info = findProviderInfo(providerId);
    if (!info) return null;
    const apiKey = process.env[info.envVar]?.trim();
    return apiKey ? { apiKey } : null;
  }
}
