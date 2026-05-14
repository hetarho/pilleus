import { db, asc, eq } from "@pilleus/db";
import { designToken as tokenTable } from "@pilleus/db/schema";
import { DesignToken } from "../../domain/entities/design-token";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";

export class DrizzleDesignTokenRepository implements DesignTokenRepository {
  async findById(id: string): Promise<DesignToken | null> {
    const [row] = await db
      .select()
      .from(tokenTable)
      .where(eq(tokenTable.id, id))
      .limit(1);
    return row ? DesignToken.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<DesignToken[]> {
    const rows = await db
      .select()
      .from(tokenTable)
      .where(eq(tokenTable.productId, productId))
      .orderBy(asc(tokenTable.group), asc(tokenTable.position), asc(tokenTable.createdAt));
    return rows.map((row) => DesignToken.reconstitute(row));
  }

  async save(token: DesignToken): Promise<void> {
    await db
      .insert(tokenTable)
      .values({
        id: token.id,
        productId: token.productId,
        group: token.group,
        name: token.name,
        position: token.position,
        paletteId: token.paletteId,
        paletteStep: token.paletteStep,
        rawValue: token.rawValue,
        description: token.description,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      })
      .onConflictDoUpdate({
        target: tokenTable.id,
        set: {
          name: token.name,
          position: token.position,
          paletteId: token.paletteId,
          paletteStep: token.paletteStep,
          rawValue: token.rawValue,
          description: token.description,
          updatedAt: token.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(tokenTable).where(eq(tokenTable.id, id));
  }
}
