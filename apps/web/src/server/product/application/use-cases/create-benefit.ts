import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import { Benefit } from "../../domain/entities/benefit";
import { type BenefitDTO, toBenefitDTO } from "../dto/benefit.dto";

export interface CreateBenefitInput {
  productId: string;
  userId: string;
  label: string;
}

export class CreateBenefitUseCase {
  constructor(
    private readonly benefits: BenefitRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateBenefitInput): Promise<BenefitDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);

    const existing = await this.benefits.findByProductId(input.productId);
    const position =
      existing.length === 0 ? 0 : Math.max(...existing.map((b) => b.position)) + 1;

    const benefit = Benefit.create({
      productId: input.productId,
      label: input.label,
      position,
    });
    await this.benefits.save(benefit);
    return toBenefitDTO(benefit);
  }
}
