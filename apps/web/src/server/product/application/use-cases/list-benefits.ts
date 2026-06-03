import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import { type BenefitDTO, toBenefitDTO } from "../dto/benefit.dto";

export interface ListBenefitsInput {
  productId: string;
  userId: string;
}

export class ListBenefitsUseCase {
  constructor(
    private readonly benefits: BenefitRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ListBenefitsInput): Promise<BenefitDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const rows = await this.benefits.findByProductId(input.productId);
    return rows.map(toBenefitDTO);
  }
}
