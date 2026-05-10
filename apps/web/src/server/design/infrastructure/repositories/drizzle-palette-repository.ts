import { db, asc, eq } from "@pilleus/db";
import { palette as paletteTable } from "@pilleus/db/schema";
import { Palette } from "../../domain/entities/palette";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";

export class DrizzlePaletteRepository implements PaletteRepository {
  async findById(id: string): Promise<Palette | null> {
    const [row] = await db.select().from(paletteTable).where(eq(paletteTable.id, id)).limit(1);
    return row ? Palette.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<Palette[]> {
    const rows = await db
      .select()
      .from(paletteTable)
      .where(eq(paletteTable.productId, productId))
      .orderBy(asc(paletteTable.position), asc(paletteTable.createdAt));
    return rows.map((row) => Palette.reconstitute(row));
  }

  async save(palette: Palette): Promise<void> {
    await db
      .insert(paletteTable)
      .values({
        id: palette.id,
        productId: palette.productId,
        name: palette.name,
        seedHex: palette.seedHex,
        position: palette.position,
        createdAt: palette.createdAt,
        updatedAt: palette.updatedAt,
      })
      .onConflictDoUpdate({
        target: paletteTable.id,
        set: {
          name: palette.name,
          seedHex: palette.seedHex,
          position: palette.position,
          updatedAt: palette.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(paletteTable).where(eq(paletteTable.id, id));
  }
}
