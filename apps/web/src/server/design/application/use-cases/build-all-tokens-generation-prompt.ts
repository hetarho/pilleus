import { loadProductPromptContext } from "../../../product/application/product-prompt-context";
import type { LlmPrompt } from "../../../shared/llm";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { BenefitRepository } from "../../../product/domain/repositories/benefit-repository";
import type { PersonaRepository } from "../../../product/domain/repositories/persona-repository";
import type { PolicyRepository } from "../../../policy/domain/repositories/policy-repository";
import { TOKEN_GROUPS, type TokenGroup } from "@/kernel/design-token";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { allTokensGenerationTask } from "../llm-tasks/all-tokens-generation-task";
import type {
  PaletteOption,
  TokenGenerationDensity,
} from "../llm-tasks/token-generation-task";

export interface BuildAllTokensGenerationPromptInput {
  productId: string;
  userId: string;
  density: TokenGenerationDensity;
}

/**
 * Build the prompt for generating ALL 5 groups of tokens in one shot.
 *
 * Same shape as the single-group variant — owns repo reads, delegates
 * string rendering to the task.
 */
export class BuildAllTokensGenerationPromptUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly palettes: PaletteRepository,
    private readonly tokens: DesignTokenRepository,
    private readonly benefits: BenefitRepository,
    private readonly personas: PersonaRepository,
    private readonly policies: PolicyRepository,
  ) {}

  async execute(input: BuildAllTokensGenerationPromptInput): Promise<LlmPrompt> {
    const context = await loadProductPromptContext(
      { products: this.products, benefits: this.benefits, personas: this.personas, policies: this.policies },
      input.productId,
      input.userId,
    );

    const palettes = await this.palettes.findByProductId(input.productId);
    const paletteOptions: PaletteOption[] = palettes.map((p) => ({
      id: p.id,
      name: p.name,
      shades: p.shades(),
    }));

    const existing = await this.tokens.findByProductId(input.productId);
    const existingNamesByGroup = Object.fromEntries(
      TOKEN_GROUPS.map((g) => [g, existing.filter((t) => t.group === g).map((t) => t.name)]),
    ) as Record<TokenGroup, string[]>;

    return allTokensGenerationTask.buildPrompt({
      context,
      density: input.density,
      palettes: paletteOptions,
      existingNamesByGroup,
    });
  }
}
