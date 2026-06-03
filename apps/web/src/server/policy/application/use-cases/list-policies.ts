import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PolicyRepository } from "../../domain/repositories/policy-repository";
import { type PolicyDTO, toPolicyDTO } from "../dto/policy.dto";

export interface ListPoliciesInput {
  productId: string;
  userId: string;
}

export class ListPoliciesUseCase {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ListPoliciesInput): Promise<PolicyDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const rows = await this.policies.findByProductId(input.productId);
    return rows.map(toPolicyDTO);
  }
}
