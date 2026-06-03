import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { ReferenceKind } from "@/kernel/reference";
import { Reference } from "../../domain/entities/reference";
import type { ReferenceRepository } from "../../domain/repositories/reference-repository";
import { type ReferenceDTO, toReferenceDTO } from "../dto/reference.dto";

export interface AddReferenceInput {
  productId: string;
  userId: string;
  sourceKind: ReferenceKind;
  sourceId: string;
  targetKind: ReferenceKind;
  targetId: string;
}

export class AddReferenceUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: AddReferenceInput): Promise<ReferenceDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const reference = Reference.create({
      productId: input.productId,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      targetKind: input.targetKind,
      targetId: input.targetId,
    });
    await this.references.save(reference);
    return toReferenceDTO(reference);
  }
}
