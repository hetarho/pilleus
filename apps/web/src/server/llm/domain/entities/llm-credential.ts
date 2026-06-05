import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import type { EncryptedSecret } from "../services/llm-key-cipher";

interface LlmCredentialProps {
  id: string;
  userId: string;
  providerId: string;
  secret: EncryptedSecret;
  /** Last 4 chars of the plaintext key — display only, never the key itself. */
  keyHint: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A user's connected API key for one provider (BYOK). The entity only ever
 * holds the ALREADY-ENCRYPTED secret — encryption/decryption is the cipher
 * port's job, orchestrated by the use case / resolver. The plaintext key
 * never lives on this object, so it can't accidentally be logged or returned.
 */
export class LlmCredential extends AggregateRoot<string> {
  private constructor(private props: LlmCredentialProps) {
    super(props.id);
  }

  static create(input: {
    userId: string;
    providerId: string;
    secret: EncryptedSecret;
    keyHint: string;
  }): LlmCredential {
    const now = new Date();
    return new LlmCredential({
      id: crypto.randomUUID(),
      userId: input.userId,
      providerId: input.providerId,
      secret: input.secret,
      keyHint: input.keyHint,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    userId: string;
    providerId: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    keyHint: string;
    createdAt: Date;
    updatedAt: Date;
  }): LlmCredential {
    return new LlmCredential({
      id: raw.id,
      userId: raw.userId,
      providerId: raw.providerId,
      secret: { ciphertext: raw.ciphertext, iv: raw.iv, authTag: raw.authTag },
      keyHint: raw.keyHint,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  get userId(): string {
    return this.props.userId;
  }

  get providerId(): string {
    return this.props.providerId;
  }

  /** The encrypted secret — hand to the cipher to recover the key. */
  get secret(): EncryptedSecret {
    return this.props.secret;
  }

  get keyHint(): string {
    return this.props.keyHint;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }
}
