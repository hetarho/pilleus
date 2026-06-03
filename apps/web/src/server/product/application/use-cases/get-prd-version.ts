import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdVersionDTO, toPrdVersionDTO } from "../dto/prd-version.dto";

export interface GetPrdVersionInput {
  id: string;
  userId: string;
}

export class GetPrdVersionUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
  ) {}

  async execute(input: GetPrdVersionInput): Promise<PrdVersionDTO> {
    const snapshot = await this.versions.findById(input.id);
    if (!snapshot) throw new NotFoundError(`PRD version ${input.id} not found`);

    const prd = await this.prds.findById(snapshot.prdId);
    if (!prd) throw new NotFoundError(`PRD ${snapshot.prdId} not found`);

    await loadOwnedProduct(this.products, prd.productId, input.userId);

    return toPrdVersionDTO(snapshot);
  }
}
