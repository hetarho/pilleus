import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import { EMPTY_PROMPT_CONTEXT } from "../product-prompt-context";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { PrdVersionRepository } from "../../domain/repositories/prd-version-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";
import { prdCompletionTask } from "../llm-tasks/prd-completion-task";

export interface SubmitPrdCompletionResponseInput {
  prdId: string;
  userId: string;
  /** Raw text the user pasted from the external LLM. Contains the
   * completed PRD inside a markdown code block (per the system prompt
   * contract). The task does the extraction. */
  rawResponse: string;
}

/**
 * Persist the parsed result of a PRD-completion LLM run.
 *
 * Manual flow: FE passes the user-pasted text in `rawResponse`.
 * Future automatic flow: a thin wrapper use case will call
 *   `prdCompletionTask.buildPrompt → provider.complete → submit(...)`
 * so this exact persistence path stays the single write site.
 *
 * Behavior matches the previous "발행하기" path: replace content with
 * the completed markdown, flip status to `published`, write a new
 * version row.
 */
export class SubmitPrdCompletionResponseUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly versions: PrdVersionRepository,
  ) {}

  async execute(input: SubmitPrdCompletionResponseInput): Promise<PrdDTO> {
    const prd = await this.prds.findById(input.prdId);
    if (!prd) throw new NotFoundError(`PRD ${input.prdId} not found`);

    await loadOwnedProduct(this.products, prd.productId, input.userId);

    /* parseResponse throws ValidationError on empty/malformed text — that
     * surfaces as BAD_REQUEST via the domain-error middleware. It only reads
     * `rawResponse`, so we pass an empty prompt context to satisfy the type. */
    const parsed = prdCompletionTask.parseResponse(input.rawResponse, {
      prd,
      context: EMPTY_PROMPT_CONTEXT,
    });

    prd.setContent(parsed.content);
    prd.setStatus("published");
    await this.prds.save(prd);

    const next = (await this.versions.latestVersionNumber(prd.id)) + 1;
    await this.versions.save({
      prdId: prd.id,
      version: next,
      title: prd.title.value,
      benefitId: prd.benefitId,
      content: prd.content,
      status: prd.status,
      aiReviewedContent: prd.aiReviewedContent,
    });

    return toPrdDTO(prd);
  }
}
