import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type ProductDTO, toProductDTO } from "../dto/product.dto";

export interface UpdateProductOverviewInput {
  id: string;
  userId: string;
  mission: string | null;
  benefits: string[];
  principles: string[];
  actors: string[];
}

export class UpdateProductOverviewUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: UpdateProductOverviewInput): Promise<ProductDTO> {
    const product = await this.products.findById(input.id);
    if (!product) {
      throw new NotFoundError(`Product ${input.id} not found`);
    }
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to update this product");
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
