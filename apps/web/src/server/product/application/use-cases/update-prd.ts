import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { PrdStatus } from "../../domain/entities/prd";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";
import { assertBenefitInProduct } from "./assert-benefit-in-product";

export interface UpdatePrdInput {
  id: string;
  userId: string;
  title?: string;
  benefitId?: string | null;
  content?: string;
  status?: PrdStatus;
  /** Pass null to explicitly clear (e.g. moving away from ai_reviewed back to
   * published). undefined leaves it untouched. */
  aiReviewedContent?: string | null;
}

interface PrdSnapshot {
  title: string;
  benefitId: string | null;
  content: string;
  status: PrdStatus;
  aiReviewedContent: string | null;
}

const equal = (a: PrdSnapshot, b: PrdSnapshot): boolean =>
  a.title === b.title &&
  a.benefitId === b.benefitId &&
  a.content === b.content &&
  a.status === b.status &&
  a.aiReviewedContent === b.aiReviewedContent;

export class UpdatePrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
    private readonly benefits: BenefitRepository,
  ) {}

  async execute(input: UpdatePrdInput): Promise<PrdDTO> {
    const prd = await this.prds.findById(input.id);
    if (!prd) throw new NotFoundError(`PRD ${input.id} not found`);

    await loadOwnedProduct(this.products, prd.productId, input.userId);

    /* Snapshot pre-mutation state so we can compare and skip writing a
     * version row when the user clicked Save without actually changing
     * anything (otherwise the timeline fills with no-op entries). */
    const before: PrdSnapshot = {
      title: prd.title.value,
      benefitId: prd.benefitId,
      content: prd.content,
      status: prd.status,
      aiReviewedContent: prd.aiReviewedContent,
    };

    if (input.title !== undefined) prd.rename(input.title);
    if (input.benefitId !== undefined) {
      await assertBenefitInProduct(this.benefits, input.benefitId, prd.productId);
      prd.setBenefitId(input.benefitId);
    }
    if (input.content !== undefined) prd.setContent(input.content);
    if (input.status !== undefined) prd.setStatus(input.status);
    if (input.aiReviewedContent !== undefined) prd.setAiReviewedContent(input.aiReviewedContent);

    const after: PrdSnapshot = {
      title: prd.title.value,
      benefitId: prd.benefitId,
      content: prd.content,
      status: prd.status,
      aiReviewedContent: prd.aiReviewedContent,
    };

    await this.prds.save(prd);

    if (!equal(before, after)) {
      const next = (await this.versions.latestVersionNumber(prd.id)) + 1;
      await this.versions.save({
        prdId: prd.id,
        version: next,
        ...after,
      });
    }

    return toPrdDTO(prd);
  }
}
