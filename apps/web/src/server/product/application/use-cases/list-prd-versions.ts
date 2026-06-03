import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import {
  type PrdVersionListItemDTO,
  toPrdVersionListItemDTO,
} from "../dto/prd-version.dto";

export interface ListPrdVersionsInput {
  prdId: string;
  userId: string;
}

export class ListPrdVersionsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
  ) {}

  async execute(input: ListPrdVersionsInput): Promise<PrdVersionListItemDTO[]> {
    const prd = await this.prds.findById(input.prdId);
    if (!prd) throw new NotFoundError(`PRD ${input.prdId} not found`);

    await loadOwnedProduct(this.products, prd.productId, input.userId);

    const snapshots = await this.versions.findByPrdId(input.prdId);
    return snapshots.map(toPrdVersionListItemDTO);
  }
}
