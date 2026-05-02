import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/domain-error";
import type { PrdStatus } from "../../domain/entities/prd";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";

export interface UpdatePrdInput {
  id: string;
  userId: string;
  title?: string;
  benefitIndex?: number | null;
  content?: string;
  status?: PrdStatus;
  /** Pass null to explicitly clear (e.g. moving away from ai_reviewed back to
   * published). undefined leaves it untouched. */
  aiReviewedContent?: string | null;
}

export class UpdatePrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
  ) {}

  async execute(input: UpdatePrdInput): Promise<PrdDTO> {
    const prd = await this.prds.findById(input.id);
    if (!prd) throw new NotFoundError(`PRD ${input.id} not found`);

    const product = await this.products.findById(prd.productId);
    if (!product || !product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("Access denied");
    }

    if (input.title !== undefined) prd.rename(input.title);
    if (input.benefitIndex !== undefined) {
      if (input.benefitIndex !== null) {
        if (input.benefitIndex < 0 || input.benefitIndex >= product.benefits.length) {
          throw new ValidationError("benefitIndex out of range for the product's benefits");
        }
      }
      prd.setBenefitIndex(input.benefitIndex);
    }
    if (input.content !== undefined) prd.setContent(input.content);
    if (input.status !== undefined) prd.setStatus(input.status);
    if (input.aiReviewedContent !== undefined) prd.setAiReviewedContent(input.aiReviewedContent);

    await this.prds.save(prd);
    return toPrdDTO(prd);
  }
}
