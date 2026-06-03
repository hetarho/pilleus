import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { ReferenceKind } from "@/kernel/reference";
import type { ReferenceRepository } from "../../domain/repositories/reference-repository";
import { type ReferenceDTO, toReferenceDTO } from "../dto/reference.dto";

export interface ListBacklinksInput {
  productId: string;
  userId: string;
  targetKind: ReferenceKind;
  targetId: string;
}

/** Backlinks — which artifacts in the product import a given target concept. */
export class ListBacklinksUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ListBacklinksInput): Promise<ReferenceDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const rows = await this.references.findByTarget(
      input.productId,
      input.targetKind,
      input.targetId,
    );
    return rows.map(toReferenceDTO);
  }
}
