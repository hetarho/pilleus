/** An encrypted secret: everything needed to recover the plaintext given the
 * master key. All fields are base64 strings (storage-friendly). */
export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Port: symmetric encryption for API keys at rest. Defined in the domain so
 * use cases depend on the capability, not on `node:crypto`. The concrete
 * AES-256-GCM adapter lives in `infrastructure/crypto`.
 */
export interface LlmKeyCipher {
  encrypt(plaintext: string): EncryptedSecret;
  decrypt(secret: EncryptedSecret): string;
}
