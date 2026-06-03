import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PolicyRepository } from "../../domain/repositories/policy-repository";

export interface DeletePolicyInput {
  id: string;
  userId: string;
}

export class DeletePolicyUseCase {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: DeletePolicyInput): Promise<void> {
    const policy = await this.policies.findById(input.id);
    if (!policy) throw new NotFoundError(`Policy ${input.id} not found`);

    await loadOwnedProduct(this.products, policy.productId, input.userId);
    await this.policies.delete(input.id);
  }
}
