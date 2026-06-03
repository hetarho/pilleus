import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { ReferenceRepository } from "../../domain/repositories/reference-repository";

export interface RemoveReferenceInput {
  id: string;
  userId: string;
}

export class RemoveReferenceUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: RemoveReferenceInput): Promise<void> {
    const reference = await this.references.findById(input.id);
    if (!reference) throw new NotFoundError(`Reference ${input.id} not found`);

    await loadOwnedProduct(this.products, reference.productId, input.userId);
    await this.references.delete(input.id);
  }
}
