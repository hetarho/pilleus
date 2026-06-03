import { db, and, asc, eq } from "@pilleus/db";
import { reference as referenceTable } from "@pilleus/db/schema";
import { isReferenceKind, type ReferenceKind } from "@/kernel/reference";
import { Reference } from "../../domain/entities/reference";
import type { ReferenceRepository } from "../../domain/repositories/reference-repository";

const toEntity = (row: typeof referenceTable.$inferSelect): Reference => {
  if (!isReferenceKind(row.sourceKind) || !isReferenceKind(row.targetKind)) {
    throw new Error(`Unknown reference kind in DB: ${row.sourceKind} -> ${row.targetKind}`);
  }
  return Reference.reconstitute({
    id: row.id,
    productId: row.productId,
    sourceKind: row.sourceKind,
    sourceId: row.sourceId,
    targetKind: row.targetKind,
    targetId: row.targetId,
    createdAt: row.createdAt,
  });
};

export class DrizzleReferenceRepository implements ReferenceRepository {
  async findById(id: string): Promise<Reference | null> {
    const [row] = await db
      .select()
      .from(referenceTable)
      .where(eq(referenceTable.id, id))
      .limit(1);
    return row ? toEntity(row) : null;
  }

  async findBySource(sourceKind: ReferenceKind, sourceId: string): Promise<Reference[]> {
    const rows = await db
      .select()
      .from(referenceTable)
      .where(
        and(
          eq(referenceTable.sourceKind, sourceKind),
          eq(referenceTable.sourceId, sourceId),
        ),
      )
      .orderBy(asc(referenceTable.createdAt));
    return rows.map(toEntity);
  }

  async findByTarget(
    productId: string,
    targetKind: ReferenceKind,
    targetId: string,
  ): Promise<Reference[]> {
    const rows = await db
      .select()
      .from(referenceTable)
      .where(
        and(
          eq(referenceTable.productId, productId),
          eq(referenceTable.targetKind, targetKind),
          eq(referenceTable.targetId, targetId),
        ),
      )
      .orderBy(asc(referenceTable.createdAt));
    return rows.map(toEntity);
  }

  async save(reference: Reference): Promise<void> {
    /* The edge is unique on (source, target); a duplicate add is a no-op
     * rather than an error so the UI can be optimistic. */
    await db
      .insert(referenceTable)
      .values({
        id: reference.id,
        productId: reference.productId,
        sourceKind: reference.sourceKind,
        sourceId: reference.sourceId,
        targetKind: reference.targetKind,
        targetId: reference.targetId,
        createdAt: reference.createdAt,
      })
      .onConflictDoNothing();
  }

  async delete(id: string): Promise<void> {
    await db.delete(referenceTable).where(eq(referenceTable.id, id));
  }
}
