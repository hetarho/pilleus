import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";

export class GetPrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<PrdDTO> {
    const prd = await this.prds.findById(input.id);
    if (!prd) throw new NotFoundError(`PRD ${input.id} not found`);

    await loadOwnedProduct(this.products, prd.productId, input.userId);
    return toPrdDTO(prd);
  }
}
