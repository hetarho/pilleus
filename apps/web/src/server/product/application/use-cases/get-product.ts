import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: { id: string; userId: string }): Promise<ProductDTO> {
    const product = await loadOwnedProduct(this.products, input.id, input.userId);
    return toProductDTO(product);
  }
}
