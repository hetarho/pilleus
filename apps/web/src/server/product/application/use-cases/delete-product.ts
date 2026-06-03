import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";

export interface DeleteProductInput {
  id: string;
  userId: string;
}

export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    await this.products.delete(input.id);
  }
}
