import type { LlmProvider } from "../../../shared/llm";
import type { PrdDTO } from "../dto/prd.dto";
import type { BuildPrdCompletionPromptUseCase } from "./build-prd-completion-prompt";
import type { SubmitPrdCompletionResponseUseCase } from "./submit-prd-completion-response";

export interface RunPrdCompletionInput {
  prdId: string;
  userId: string;
  /** Provider model id; omit to use the provider default. Already validated
   * by the time it reaches here (the resolver checked it). */
  modelId?: string;
}

/**
 * Server-side PRD completion: build the prompt → call the provider → submit
 * the raw text through the SAME persistence path as the manual (copy/paste)
 * flow. The only new behavior vs the manual flow is the provider round-trip
 * in the middle, so the result is byte-for-byte what a user would get by
 * pasting the model's answer into the 발행 dialog.
 *
 * The provider is INJECTED (resolved per request from the user's credential),
 * so this use case is provider-agnostic — swapping Anthropic↔OpenAI or
 * changing models never touches it.
 *
 * Caveat: the PRD-completion system prompt is interactive — it asks the user
 * clarifying questions before emitting the final markdown block. A single
 * server round-trip therefore only completes a PRD that's already
 * unambiguous; if the model responds with questions instead, Submit's parse
 * step throws (no markdown block) and the user falls back to the interactive
 * copy-prompt flow. That's an accepted trade-off of one-shot server runs.
 */
export class RunPrdCompletionUseCase {
  constructor(
    private readonly buildPrompt: BuildPrdCompletionPromptUseCase,
    private readonly submitResponse: SubmitPrdCompletionResponseUseCase,
    private readonly provider: LlmProvider,
  ) {}

  async execute(input: RunPrdCompletionInput): Promise<PrdDTO> {
    const prompt = await this.buildPrompt.execute({
      prdId: input.prdId,
      userId: input.userId,
    });
    const result = await this.provider.complete(prompt, { model: input.modelId });
    return this.submitResponse.execute({
      prdId: input.prdId,
      userId: input.userId,
      rawResponse: result.text,
    });
  }
}
