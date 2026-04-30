import { Product } from "../../domain/entities/product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface CreateProductInput {
  name: string;
  description?: string;
  userId: string;
}

export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductDTO> {
    const product = Product.create({
      name: input.name,
      description: input.description ?? null,
      userId: input.userId,
    });
    await this.products.save(product);
    return toProductDTO(product);
  }
}
