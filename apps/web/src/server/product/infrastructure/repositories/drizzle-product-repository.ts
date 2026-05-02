import { db, eq } from "@pilleus/db";
import { product as productTable } from "@pilleus/db/schema";
import { Product } from "../../domain/entities/product";
import type { ProductRepository } from "../../domain/repositories/product-repository";

export class DrizzleProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const [row] = await db.select().from(productTable).where(eq(productTable.id, id)).limit(1);
    return row ? Product.reconstitute(row) : null;
  }

  async findByUserId(userId: string): Promise<Product[]> {
    const rows = await db.select().from(productTable).where(eq(productTable.userId, userId));
    return rows.map((row) => Product.reconstitute(row));
  }

  async save(product: Product): Promise<void> {
    await db
      .insert(productTable)
      .values({
        id: product.id,
        name: product.name.value,
        description: product.description,
        mission: product.mission,
        benefits: [...product.benefits],
        principles: [...product.principles],
        actors: [...product.actors],
        userId: product.userId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .onConflictDoUpdate({
        target: productTable.id,
        set: {
          name: product.name.value,
          description: product.description,
          mission: product.mission,
          benefits: [...product.benefits],
          principles: [...product.principles],
          actors: [...product.actors],
          updatedAt: product.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(productTable).where(eq(productTable.id, id));
  }
}
