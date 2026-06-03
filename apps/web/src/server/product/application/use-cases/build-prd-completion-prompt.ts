import { NotFoundError } from "../../../shared/errors/domain-error";
import type { LlmPrompt } from "../../../shared/llm";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { BenefitRepository } from "../../domain/repositories/benefit-repository";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";
import type { PolicyRepository } from "../../../policy/domain/repositories/policy-repository";
import { loadProductPromptContext } from "../product-prompt-context";
import { prdCompletionTask } from "../llm-tasks/prd-completion-task";

export interface BuildPrdCompletionPromptInput {
  prdId: string;
  userId: string;
}

/**
 * Build the system+user prompt pair for the PRD-completion task.
 *
 * Used today by the manual flow: FE calls this query, copies the result
 * to the clipboard, the user runs it through an external LLM. Once we
 * have an API key, this same use case can be reused server-side as the
 * first half of `runLlmTask(prdCompletionTask, ...)`.
 */
export class BuildPrdCompletionPromptUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
    private readonly benefits: BenefitRepository,
    private readonly personas: PersonaRepository,
    private readonly policies: PolicyRepository,
  ) {}

  async execute(input: BuildPrdCompletionPromptInput): Promise<LlmPrompt> {
    const prd = await this.prds.findById(input.prdId);
    if (!prd) throw new NotFoundError(`PRD ${input.prdId} not found`);

    const context = await loadProductPromptContext(
      { products: this.products, benefits: this.benefits, personas: this.personas, policies: this.policies },
      prd.productId,
      input.userId,
    );

    return prdCompletionTask.buildPrompt({ prd, context });
  }
}
