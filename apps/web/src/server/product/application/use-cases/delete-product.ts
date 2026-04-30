import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../domain/repositories/product-repository";

export interface DeleteProductInput {
  id: string;
  userId: string;
}

export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const product = await this.products.findById(input.id);
    if (!product) {
      throw new NotFoundError(`Product ${input.id} not found`);
    }
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to delete this product");
    }
    await this.products.delete(input.id);
  }
}
