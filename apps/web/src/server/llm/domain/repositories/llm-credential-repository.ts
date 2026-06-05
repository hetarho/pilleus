import type { LlmCredential } from "../entities/llm-credential";

/** Persistence port for BYOK credentials. One credential per
 * (userId, providerId); `save` upserts on that pair. */
export interface LlmCredentialRepository {
  findByUserAndProvider(
    userId: string,
    providerId: string,
  ): Promise<LlmCredential | null>;
  findByUserId(userId: string): Promise<LlmCredential[]>;
  save(credential: LlmCredential): Promise<void>;
  delete(userId: string, providerId: string): Promise<void>;
}
