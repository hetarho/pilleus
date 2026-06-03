import { loadOwnedProduct } from "../load-owned-product";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdListItemDTO, toPrdListItemDTO } from "../dto/prd.dto";

export class ListPrdsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
  ) {}

  async execute(input: { productId: string; userId: string }): Promise<PrdListItemDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);

    const prds = await this.prds.findByProductId(input.productId);
    /* One batched query for max(version) per prd_id rather than N+1 round
     * trips — list views can grow long. Missing entries (no snapshots yet)
     * surface as null on the DTO. */
    const versionMap = await this.versions.latestVersionNumbersByPrdIds(
      prds.map((p) => p.id),
    );
    return prds.map((p) => toPrdListItemDTO(p, versionMap[p.id] ?? null));
  }
}
