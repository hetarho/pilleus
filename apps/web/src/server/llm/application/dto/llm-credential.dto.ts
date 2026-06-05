import type { LlmCredential } from "../../domain/entities/llm-credential";

/** Safe-to-return view of a connected credential. NEVER includes the key or
 * any ciphertext — only the provider, a display hint, and timestamps. */
export interface LlmCredentialDTO {
  providerId: string;
  keyHint: string;
  updatedAt: Date;
}

export const toLlmCredentialDTO = (c: LlmCredential): LlmCredentialDTO => ({
  providerId: c.providerId,
  keyHint: c.keyHint,
  updatedAt: c.updatedAt,
});
