import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { ReferenceKind } from "@/kernel/reference";
import type { ReferenceRepository } from "../../domain/repositories/reference-repository";
import { type ReferenceDTO, toReferenceDTO } from "../dto/reference.dto";

export interface ListReferencesInput {
  productId: string;
  userId: string;
  sourceKind: ReferenceKind;
  sourceId: string;
}

/** Forward edges — what a given source artifact imports. */
export class ListReferencesUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ListReferencesInput): Promise<ReferenceDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const rows = await this.references.findBySource(input.sourceKind, input.sourceId);
    return rows.filter((r) => r.productId === input.productId).map(toReferenceDTO);
  }
}
