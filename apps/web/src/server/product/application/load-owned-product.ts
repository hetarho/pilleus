import { ForbiddenError, NotFoundError } from "../../shared/errors/domain-error";
import type { Product } from "../domain/entities/product";
import type { ProductRepository } from "../domain/repositories/product-repository";

/**
 * Load a product and assert the caller owns it. Centralizes the
 * find → exists → ownership guard that every product-scoped use case repeats,
 * so the rule and its error mapping live in exactly one place.
 */
export async function loadOwnedProduct(
  products: ProductRepository,
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await products.findById(productId);
  if (!product) throw new NotFoundError(`Product ${productId} not found`);
  if (!product.isOwnedBy(userId)) throw new ForbiddenError("Access denied");
  return product;
}
