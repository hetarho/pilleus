import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
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
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) throw new ForbiddenError("Access denied");
    const rows = await this.policies.findByProductId(input.productId);
    return rows.map(toPolicyDTO);
  }
}
