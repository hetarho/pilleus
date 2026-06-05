import type { LlmCredential } from "./provider";

/**
 * Port: resolve the credential to use for a provider, for a given user.
 *
 * This is the BYOK seam. Today an env-backed adapter (`EnvCredentialResolver`
 * in the `llm` context) reads a shared dev key. Tomorrow a store-backed
 * adapter reads the key the user connected in "내 정보 관리" — same port,
 * zero changes at any call site.
 *
 * Returns `null` when no credential exists. Callers surface that as "키를
 * 연결하거나 프롬프트 복사 방식을 사용해주세요" rather than failing hard, so
 * the manual flow always remains available.
 */
export interface LlmCredentialResolver {
  resolve(input: {
    userId: string;
    providerId: string;
  }): Promise<LlmCredential | null>;
}
