import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/domain-error";
import { Prd } from "../../domain/entities/prd";
import { PRD_BOILERPLATE } from "../../domain/prd-boilerplate";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";

export interface CreatePrdInput {
  productId: string;
  userId: string;
  title: string;
  benefitIndex?: number | null;
}

export class CreatePrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
  ) {}

  async execute(input: CreatePrdInput): Promise<PrdDTO> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) throw new ForbiddenError("Access denied");

    if (input.benefitIndex != null) {
      if (input.benefitIndex < 0 || input.benefitIndex >= product.benefits.length) {
        throw new ValidationError("benefitIndex out of range for the product's benefits");
      }
    }

    const prd = Prd.create({
      productId: input.productId,
      title: input.title,
      benefitIndex: input.benefitIndex ?? null,
      content: PRD_BOILERPLATE,
    });
    await this.prds.save(prd);
    /* Seed version 1 — the pristine boilerplate state. The history panel
     * thus always has at least one entry to compare against. */
    await this.versions.save({
      prdId: prd.id,
      version: 1,
      title: prd.title.value,
      benefitIndex: prd.benefitIndex,
      content: prd.content,
      status: prd.status,
      aiReviewedContent: prd.aiReviewedContent,
    });
    return toPrdDTO(prd);
  }
}
