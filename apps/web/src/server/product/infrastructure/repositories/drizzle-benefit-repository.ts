import { db, asc, eq } from "@pilleus/db";
import { benefit as benefitTable } from "@pilleus/db/schema";
import { Benefit } from "../../domain/entities/benefit";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";

export class DrizzleBenefitRepository implements BenefitRepository {
  async findById(id: string): Promise<Benefit | null> {
    const [row] = await db
      .select()
      .from(benefitTable)
      .where(eq(benefitTable.id, id))
      .limit(1);
    return row ? Benefit.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<Benefit[]> {
    const rows = await db
      .select()
      .from(benefitTable)
      .where(eq(benefitTable.productId, productId))
      .orderBy(asc(benefitTable.position), asc(benefitTable.createdAt));
    return rows.map((row) => Benefit.reconstitute(row));
  }

  async save(benefit: Benefit): Promise<void> {
    await db
      .insert(benefitTable)
      .values({
        id: benefit.id,
        productId: benefit.productId,
        label: benefit.label,
        position: benefit.position,
        createdAt: benefit.createdAt,
        updatedAt: benefit.updatedAt,
      })
      .onConflictDoUpdate({
        target: benefitTable.id,
        set: {
          label: benefit.label,
          position: benefit.position,
          updatedAt: benefit.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(benefitTable).where(eq(benefitTable.id, id));
  }
}
