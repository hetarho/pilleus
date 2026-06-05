import type { LlmCredentialRepository } from "../../domain/repositories/llm-credential-repository";

export interface DisconnectLlmCredentialInput {
  userId: string;
  providerId: string;
}

/** Remove a user's connected key for a provider. Idempotent — deleting a
 * provider that isn't connected is a no-op. */
export class DisconnectLlmCredentialUseCase {
  constructor(private readonly credentials: LlmCredentialRepository) {}

  async execute(input: DisconnectLlmCredentialInput): Promise<void> {
    await this.credentials.delete(input.userId, input.providerId);
  }
}
