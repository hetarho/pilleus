import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface UpdateProductOverviewInput {
  id: string;
  userId: string;
  description?: string | null;
  mission: string | null;
  benefits: string[];
  principles: string[];
  actors: string[];
}

export class UpdateProductOverviewUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: UpdateProductOverviewInput): Promise<ProductDTO> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    if (input.description !== undefined) {
      product.describe(input.description);
    }
    product.updateOverview({
      mission: input.mission,
      benefits: input.benefits,
      principles: input.principles,
      actors: input.actors,
    });
    await this.products.save(product);
    return toProductDTO(product);
  }
}
