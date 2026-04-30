import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: { id: string; userId: string }): Promise<ProductDTO> {
    const product = await this.products.findById(input.id);
    if (!product) {
      throw new NotFoundError(`Product ${input.id} not found`);
    }
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have access to this product");
    }
    return toProductDTO(product);
  }
}
