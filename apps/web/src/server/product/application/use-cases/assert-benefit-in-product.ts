import { ValidationError } from "../../../shared/errors/domain-error";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";

/** Guard a PRD's inward import: a non-null benefitId must resolve to a benefit
 * that belongs to the same product. null (no benefit link) always passes. */
export async function assertBenefitInProduct(
  benefits: BenefitRepository,
  benefitId: string | null,
  productId: string,
): Promise<void> {
  if (benefitId == null) return;
  const benefit = await benefits.findById(benefitId);
  if (!benefit || benefit.productId !== productId) {
    throw new ValidationError("benefitId does not belong to this product");
  }
}
