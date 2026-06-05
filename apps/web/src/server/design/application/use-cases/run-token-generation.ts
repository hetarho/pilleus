import type { LlmProvider } from "../../../shared/llm";
import type { TokenGroup } from "@/kernel/design-token";
import type { TokenGenerationDensity } from "../llm-tasks/token-generation-task";
import type { BuildTokenGenerationPromptUseCase } from "./build-token-generation-prompt";
import type {
  SubmitTokenGenerationResponseOutput,
  SubmitTokenGenerationResponseUseCase,
} from "./submit-token-generation-response";

export interface RunTokenGenerationInput {
  productId: string;
  userId: string;
  group: TokenGroup;
  density: TokenGenerationDensity;
  modelId?: string;
}

/**
 * Server-side single-group token generation: build → provider → submit.
 * Same append-only persistence + collision reporting as the manual flow —
 * the provider call simply replaces the user's copy/paste round-trip.
 */
export class RunTokenGenerationUseCase {
  constructor(
    private readonly buildPrompt: BuildTokenGenerationPromptUseCase,
    private readonly submitResponse: SubmitTokenGenerationResponseUseCase,
    private readonly provider: LlmProvider,
  ) {}

  async execute(
    input: RunTokenGenerationInput,
  ): Promise<SubmitTokenGenerationResponseOutput> {
    const prompt = await this.buildPrompt.execute({
      productId: input.productId,
      userId: input.userId,
      group: input.group,
      density: input.density,
    });
    const result = await this.provider.complete(prompt, { model: input.modelId });
    return this.submitResponse.execute({
      productId: input.productId,
      userId: input.userId,
      group: input.group,
      density: input.density,
      rawResponse: result.text,
    });
  }
}
