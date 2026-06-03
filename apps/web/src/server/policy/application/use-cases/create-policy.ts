import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PolicyCategory } from "@/kernel/policy";
import { Policy } from "../../domain/entities/policy";
import type { PolicyRepository } from "../../domain/repositories/policy-repository";
import { type PolicyDTO, toPolicyDTO } from "../dto/policy.dto";

export interface CreatePolicyInput {
  productId: string;
  userId: string;
  category: PolicyCategory;
  section: string | null;
  title: string;
  body: string;
}

export class CreatePolicyUseCase {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreatePolicyInput): Promise<PolicyDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);

    const existing = await this.policies.findByProductId(input.productId);
    const inBucket = existing.filter(
      (p) => p.category === input.category && p.section === input.section,
    );
    /* Append after the current max rather than using the bucket count, so a
     * prior delete leaving a gap can't produce a position that collides with
     * a surviving sibling. */
    const position =
      inBucket.length === 0 ? 0 : Math.max(...inBucket.map((p) => p.position)) + 1;

    const policy = Policy.create({
      productId: input.productId,
      category: input.category,
      section: input.section,
      title: input.title,
      body: input.body,
      position,
    });
    await this.policies.save(policy);
    return toPolicyDTO(policy);
  }
}
