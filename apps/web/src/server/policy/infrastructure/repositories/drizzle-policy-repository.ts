import { db, asc, eq } from "@pilleus/db";
import { policy as policyTable } from "@pilleus/db/schema";
import { Policy } from "../../domain/entities/policy";
import type { PolicyRepository } from "../../domain/repositories/policy-repository";

export class DrizzlePolicyRepository implements PolicyRepository {
  async findById(id: string): Promise<Policy | null> {
    const [row] = await db
      .select()
      .from(policyTable)
      .where(eq(policyTable.id, id))
      .limit(1);
    return row ? Policy.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<Policy[]> {
    const rows = await db
      .select()
      .from(policyTable)
      .where(eq(policyTable.productId, productId))
      .orderBy(
        asc(policyTable.category),
        asc(policyTable.section),
        asc(policyTable.position),
        asc(policyTable.createdAt),
      );
    return rows.map((row) => Policy.reconstitute(row));
  }

  async save(policy: Policy): Promise<void> {
    await db
      .insert(policyTable)
      .values({
        id: policy.id,
        productId: policy.productId,
        category: policy.category,
        section: policy.section,
        title: policy.title,
        body: policy.body,
        position: policy.position,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      })
      .onConflictDoUpdate({
        target: policyTable.id,
        set: {
          category: policy.category,
          section: policy.section,
          title: policy.title,
          body: policy.body,
          position: policy.position,
          updatedAt: policy.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(policyTable).where(eq(policyTable.id, id));
  }
}
