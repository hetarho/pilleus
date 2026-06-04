import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface SetProductMissionInput {
  id: string;
  userId: string;
  mission: string | null;
}

/** Mission is the single scalar at the Intent core — edited on its own section. */
export class SetProductMissionUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: SetProductMissionInput): Promise<ProductDTO> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    product.setMission(input.mission);
    await this.products.save(product);
    return toProductDTO(product);
  }
}
