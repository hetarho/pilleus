import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface UpdateProductOverviewInput {
  id: string;
  userId: string;
  description?: string | null;
  mission: string | null;
}

export class UpdateProductOverviewUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: UpdateProductOverviewInput): Promise<ProductDTO> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    if (input.description !== undefined) {
      product.describe(input.description);
    }
    product.setMission(input.mission);
    await this.products.save(product);
    return toProductDTO(product);
  }
}
