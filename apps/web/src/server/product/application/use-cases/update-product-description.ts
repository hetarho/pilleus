import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface UpdateProductDescriptionInput {
  id: string;
  userId: string;
  description: string | null;
}

/** Description is product identity (it sits above the rings), edited on the
 * product Overview — not part of any single Intent artifact. */
export class UpdateProductDescriptionUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: UpdateProductDescriptionInput): Promise<ProductDTO> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    product.describe(input.description);
    await this.products.save(product);
    return toProductDTO(product);
  }
}
