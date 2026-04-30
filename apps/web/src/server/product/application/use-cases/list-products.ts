import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(userId: string): Promise<ProductDTO[]> {
    const products = await this.products.findByUserId(userId);
    return products.map(toProductDTO);
  }
}
