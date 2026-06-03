import { loadOwnedProduct } from "../load-owned-product";
import { Prd } from "../../domain/entities/prd";
import { PRD_BOILERPLATE } from "@/kernel/prd-boilerplate";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";
import { assertBenefitInProduct } from "./assert-benefit-in-product";

export interface CreatePrdInput {
  productId: string;
  userId: string;
  title: string;
  benefitId?: string | null;
}

export class CreatePrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
    private readonly benefits: BenefitRepository,
  ) {}

  async execute(input: CreatePrdInput): Promise<PrdDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    await assertBenefitInProduct(this.benefits, input.benefitId ?? null, input.productId);

    const prd = Prd.create({
      productId: input.productId,
      title: input.title,
      benefitId: input.benefitId ?? null,
      content: PRD_BOILERPLATE,
    });
    await this.prds.save(prd);
    /* Seed version 1 — the pristine boilerplate state. The history panel
     * thus always has at least one entry to compare against. */
    await this.versions.save({
      prdId: prd.id,
      version: 1,
      title: prd.title.value,
      benefitId: prd.benefitId,
      content: prd.content,
      status: prd.status,
      aiReviewedContent: prd.aiReviewedContent,
    });
    return toPrdDTO(prd);
  }
}
