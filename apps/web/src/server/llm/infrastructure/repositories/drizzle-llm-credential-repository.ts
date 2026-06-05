import { db, eq, and } from "@pilleus/db";
import { llmCredential as table } from "@pilleus/db/schema";
import { LlmCredential } from "../../domain/entities/llm-credential";
import type { LlmCredentialRepository } from "../../domain/repositories/llm-credential-repository";

export class DrizzleLlmCredentialRepository implements LlmCredentialRepository {
  async findByUserAndProvider(
    userId: string,
    providerId: string,
  ): Promise<LlmCredential | null> {
    const [row] = await db
      .select()
      .from(table)
      .where(and(eq(table.userId, userId), eq(table.providerId, providerId)))
      .limit(1);
    return row ? LlmCredential.reconstitute(row) : null;
  }

  async findByUserId(userId: string): Promise<LlmCredential[]> {
    const rows = await db.select().from(table).where(eq(table.userId, userId));
    return rows.map((row) => LlmCredential.reconstitute(row));
  }

  async save(credential: LlmCredential): Promise<void> {
    const secret = credential.secret;
    await db
      .insert(table)
      .values({
        id: credential.id,
        userId: credential.userId,
        providerId: credential.providerId,
        ciphertext: secret.ciphertext,
        iv: secret.iv,
        authTag: secret.authTag,
        keyHint: credential.keyHint,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      })
      /* Reconnecting a provider replaces the stored key in place. */
      .onConflictDoUpdate({
        target: [table.userId, table.providerId],
        set: {
          ciphertext: secret.ciphertext,
          iv: secret.iv,
          authTag: secret.authTag,
          keyHint: credential.keyHint,
          updatedAt: credential.updatedAt,
        },
      });
  }

  async delete(userId: string, providerId: string): Promise<void> {
    await db
      .delete(table)
      .where(and(eq(table.userId, userId), eq(table.providerId, providerId)));
  }
}
