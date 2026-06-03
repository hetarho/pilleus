import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";

export interface DeleteDesignTokenInput {
  id: string;
  userId: string;
}

export class DeleteDesignTokenUseCase {
  constructor(
    private readonly tokens: DesignTokenRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: DeleteDesignTokenInput): Promise<void> {
    const token = await this.tokens.findById(input.id);
    if (!token) throw new NotFoundError(`Token ${input.id} not found`);

    await loadOwnedProduct(this.products, token.productId, input.userId);

    await this.tokens.delete(input.id);
  }
}
