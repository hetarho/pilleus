import { ValidationError } from "../../../shared/errors/domain-error";
import { findProviderInfo } from "../../../shared/llm";
import { LlmCredential } from "../../domain/entities/llm-credential";
import type { LlmCredentialRepository } from "../../domain/repositories/llm-credential-repository";
import type { LlmKeyCipher } from "../../domain/services/llm-key-cipher";
import { type LlmCredentialDTO, toLlmCredentialDTO } from "../dto/llm-credential.dto";

export interface ConnectLlmCredentialInput {
  userId: string;
  providerId: string;
  /** Plaintext API key — encrypted here, never persisted or returned raw. */
  apiKey: string;
}

/**
 * Connect (or replace) a user's API key for a provider. Validates the
 * provider against the catalog, encrypts the key via the cipher port, and
 * upserts. Returns a key-free DTO.
 */
export class ConnectLlmCredentialUseCase {
  constructor(
    private readonly credentials: LlmCredentialRepository,
    private readonly cipher: LlmKeyCipher,
  ) {}

  async execute(input: ConnectLlmCredentialInput): Promise<LlmCredentialDTO> {
    const info = findProviderInfo(input.providerId);
    if (!info) {
      throw new ValidationError(
        `지원하지 않는 provider입니다: ${input.providerId}`,
      );
    }

    const apiKey = input.apiKey.trim();
    if (apiKey.length < 8) {
      throw new ValidationError("API 키가 너무 짧습니다. 키를 다시 확인해주세요.");
    }

    const credential = LlmCredential.create({
      userId: input.userId,
      providerId: info.id,
      secret: this.cipher.encrypt(apiKey),
      keyHint: apiKey.slice(-4),
    });
    await this.credentials.save(credential);
    return toLlmCredentialDTO(credential);
  }
}
