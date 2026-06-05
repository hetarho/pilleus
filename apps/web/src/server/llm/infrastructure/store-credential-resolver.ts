import type { LlmCredential, LlmCredentialResolver } from "../../shared/llm";
import type { LlmCredentialRepository } from "../domain/repositories/llm-credential-repository";
import type { LlmKeyCipher } from "../domain/services/llm-key-cipher";

/**
 * Store-backed `LlmCredentialResolver`: reads the user's connected key from
 * the credential repository and decrypts it. Returns null when the user has
 * not connected a key for this provider (so a chain can fall back, and the
 * server-run path degrades gracefully to the copy-prompt flow).
 *
 * This is the BYOK resolver — wired in `composition.ts`.
 */
export class StoreCredentialResolver implements LlmCredentialResolver {
  constructor(
    private readonly credentials: LlmCredentialRepository,
    private readonly cipher: LlmKeyCipher,
  ) {}

  async resolve({
    userId,
    providerId,
  }: {
    userId: string;
    providerId: string;
  }): Promise<LlmCredential | null> {
    const credential = await this.credentials.findByUserAndProvider(
      userId,
      providerId,
    );
    if (!credential) return null;
    return { apiKey: this.cipher.decrypt(credential.secret) };
  }
}
