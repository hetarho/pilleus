import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import { type BenefitDTO, toBenefitDTO } from "../dto/benefit.dto";

export interface UpdateBenefitInput {
  id: string;
  userId: string;
  label: string;
}

export class UpdateBenefitUseCase {
  constructor(
    private readonly benefits: BenefitRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdateBenefitInput): Promise<BenefitDTO> {
    const benefit = await this.benefits.findById(input.id);
    if (!benefit) throw new NotFoundError(`Benefit ${input.id} not found`);

    await loadOwnedProduct(this.products, benefit.productId, input.userId);
    benefit.relabel(input.label);
    await this.benefits.save(benefit);
    return toBenefitDTO(benefit);
  }
}
