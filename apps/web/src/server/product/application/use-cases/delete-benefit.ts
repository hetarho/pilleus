import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";

export interface DeleteBenefitInput {
  id: string;
  userId: string;
}

export class DeleteBenefitUseCase {
  constructor(
    private readonly benefits: BenefitRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: DeleteBenefitInput): Promise<void> {
    const benefit = await this.benefits.findById(input.id);
    if (!benefit) throw new NotFoundError(`Benefit ${input.id} not found`);

    await loadOwnedProduct(this.products, benefit.productId, input.userId);
    await this.benefits.delete(input.id);
  }
}
