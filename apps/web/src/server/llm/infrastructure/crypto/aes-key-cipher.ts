import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { ValidationError } from "../../../shared/errors/domain-error";
import type {
  EncryptedSecret,
  LlmKeyCipher,
} from "../../domain/services/llm-key-cipher";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce, GCM standard
const KEY_BYTES = 32; // AES-256

/**
 * AES-256-GCM adapter for `LlmKeyCipher`.
 *
 * Master key comes from `CREDENTIAL_ENCRYPTION_KEY` (64 hex chars OR base64
 * decoding to 32 bytes). The key is resolved LAZILY (per call, memoized) so a
 * missing env var doesn't crash the whole app at import time — it only fails
 * the moment an encrypt/decrypt is actually attempted, with a clear message.
 */
export class AesKeyCipher implements LlmKeyCipher {
  private cachedKey: Buffer | null = null;

  encrypt(plaintext: string): EncryptedSecret {
    const key = this.masterKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    return {
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    };
  }

  decrypt(secret: EncryptedSecret): string {
    const key = this.masterKey();
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(secret.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }

  private masterKey(): Buffer {
    if (this.cachedKey) return this.cachedKey;
    const raw = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
    if (!raw) {
      throw new ValidationError(
        "CREDENTIAL_ENCRYPTION_KEY가 설정되지 않아 API 키를 암호화할 수 없습니다. " +
          "32바이트 키를 hex(64자) 또는 base64로 설정해주세요.",
      );
    }
    const key = parseKey(raw);
    if (key.length !== KEY_BYTES) {
      throw new ValidationError(
        `CREDENTIAL_ENCRYPTION_KEY는 32바이트여야 합니다 (현재 ${key.length}바이트). ` +
          "hex(64자) 또는 base64 32바이트로 설정해주세요.",
      );
    }
    this.cachedKey = key;
    return key;
  }
}

/** Accept hex (64 chars) or base64. Hex is tried first so a 64-char hex
 * string isn't misread as base64. */
function parseKey(raw: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return Buffer.from(raw, "base64");
}
