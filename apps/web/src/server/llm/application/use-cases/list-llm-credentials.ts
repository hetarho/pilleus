import type { LlmCredentialRepository } from "../../domain/repositories/llm-credential-repository";
import { type LlmCredentialDTO, toLlmCredentialDTO } from "../dto/llm-credential.dto";

/** A user's connected credentials, as key-free DTOs (providerId + hint). */
export class ListLlmCredentialsUseCase {
  constructor(private readonly credentials: LlmCredentialRepository) {}

  async execute(input: { userId: string }): Promise<LlmCredentialDTO[]> {
    const rows = await this.credentials.findByUserId(input.userId);
    return rows.map(toLlmCredentialDTO);
  }
}
