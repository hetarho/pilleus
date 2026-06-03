import { db, desc, eq } from "@pilleus/db";
import { prd as prdTable } from "@pilleus/db/schema";
import { Prd } from "../../domain/entities/prd";
import type { PrdRepository } from "../../domain/repositories/prd-repository";

export class DrizzlePrdRepository implements PrdRepository {
  async findById(id: string): Promise<Prd | null> {
    const [row] = await db.select().from(prdTable).where(eq(prdTable.id, id)).limit(1);
    return row ? Prd.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<Prd[]> {
    const rows = await db
      .select()
      .from(prdTable)
      .where(eq(prdTable.productId, productId))
      .orderBy(desc(prdTable.createdAt));
    return rows.map((row) => Prd.reconstitute(row));
  }

  async save(prd: Prd): Promise<void> {
    await db
      .insert(prdTable)
      .values({
        id: prd.id,
        productId: prd.productId,
        title: prd.title.value,
        benefitId: prd.benefitId,
        content: prd.content,
        status: prd.status,
        aiReviewedContent: prd.aiReviewedContent,
        createdAt: prd.createdAt,
        updatedAt: prd.updatedAt,
      })
      .onConflictDoUpdate({
        target: prdTable.id,
        set: {
          title: prd.title.value,
          benefitId: prd.benefitId,
          content: prd.content,
          status: prd.status,
          aiReviewedContent: prd.aiReviewedContent,
          updatedAt: prd.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(prdTable).where(eq(prdTable.id, id));
  }
}
