import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PolicyRepository } from "../../domain/repositories/policy-repository";
import { type PolicyDTO, toPolicyDTO } from "../dto/policy.dto";

export interface UpdatePolicyInput {
  id: string;
  userId: string;
  title?: string;
  body?: string;
  section?: string | null;
}

export class UpdatePolicyUseCase {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdatePolicyInput): Promise<PolicyDTO> {
    const policy = await this.policies.findById(input.id);
    if (!policy) throw new NotFoundError(`Policy ${input.id} not found`);

    await loadOwnedProduct(this.products, policy.productId, input.userId);

    const sectionChanged =
      input.section !== undefined && input.section !== policy.section;

    if (input.title !== undefined) policy.rename(input.title);
    if (input.body !== undefined) policy.setBody(input.body);
    if (input.section !== undefined) policy.setSection(input.section);

    /* Moving to a different section means leaving the old bucket's ordering
     * and joining a new one — re-append at the end of the destination bucket
     * so the stale position can't collide with a sibling already there. */
    if (sectionChanged) {
      const siblings = await this.policies.findByProductId(policy.productId);
      const inBucket = siblings.filter(
        (p) =>
          p.id !== policy.id &&
          p.category === policy.category &&
          p.section === policy.section,
      );
      policy.reorder(
        inBucket.length === 0 ? 0 : Math.max(...inBucket.map((p) => p.position)) + 1,
      );
    }

    await this.policies.save(policy);
    return toPolicyDTO(policy);
  }
}
