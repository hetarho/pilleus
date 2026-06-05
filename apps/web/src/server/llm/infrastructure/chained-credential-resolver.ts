import type { LlmCredential, LlmCredentialResolver } from "../../shared/llm";

/**
 * Tries each resolver in order, returning the first credential found. Used to
 * prefer the user's connected key (store) but fall back to a shared dev key
 * (env) during local development. In production the env resolver simply
 * returns null, so only real BYOK keys are used.
 */
export class ChainedCredentialResolver implements LlmCredentialResolver {
  constructor(private readonly resolvers: readonly LlmCredentialResolver[]) {}

  async resolve(input: {
    userId: string;
    providerId: string;
  }): Promise<LlmCredential | null> {
    for (const resolver of this.resolvers) {
      const credential = await resolver.resolve(input);
      if (credential) return credential;
    }
    return null;
  }
}
