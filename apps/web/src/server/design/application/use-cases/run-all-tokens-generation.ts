import type { LlmProvider } from "../../../shared/llm";
import type { TokenGenerationDensity } from "../llm-tasks/token-generation-task";
import type { BuildAllTokensGenerationPromptUseCase } from "./build-all-tokens-generation-prompt";
import type {
  SubmitAllTokensGenerationResponseOutput,
  SubmitAllTokensGenerationResponseUseCase,
} from "./submit-all-tokens-generation-response";

export interface RunAllTokensGenerationInput {
  productId: string;
  userId: string;
  density: TokenGenerationDensity;
  modelId?: string;
}

/**
 * Server-side all-groups token generation: build → provider → submit, in one
 * round-trip. Mirrors `RunTokenGenerationUseCase` for the 5-group prompt.
 */
export class RunAllTokensGenerationUseCase {
  constructor(
    private readonly buildPrompt: BuildAllTokensGenerationPromptUseCase,
    private readonly submitResponse: SubmitAllTokensGenerationResponseUseCase,
    private readonly provider: LlmProvider,
  ) {}

  async execute(
    input: RunAllTokensGenerationInput,
  ): Promise<SubmitAllTokensGenerationResponseOutput> {
    const prompt = await this.buildPrompt.execute({
      productId: input.productId,
      userId: input.userId,
      density: input.density,
    });
    const result = await this.provider.complete(prompt, { model: input.modelId });
    return this.submitResponse.execute({
      productId: input.productId,
      userId: input.userId,
      density: input.density,
      rawResponse: result.text,
    });
  }
}
