import { loadProductPromptContext } from "../../../product/application/product-prompt-context";
import type { LlmPrompt } from "../../../shared/llm";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { BenefitRepository } from "../../../product/domain/repositories/benefit-repository";
import type { PersonaRepository } from "../../../product/domain/repositories/persona-repository";
import type { PolicyRepository } from "../../../policy/domain/repositories/policy-repository";
import type { TokenGroup } from "@/kernel/design-token";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import {
  tokenGenerationTask,
  type PaletteOption,
  type TokenGenerationDensity,
} from "../llm-tasks/token-generation-task";

export interface BuildTokenGenerationPromptInput {
  productId: string;
  userId: string;
  group: TokenGroup;
  density: TokenGenerationDensity;
}

/**
 * Build the system+user prompt for generating tokens of one group.
 *
 * Owns the data gathering (product + palettes + existing token names);
 * the task itself only knows how to render the prompt strings.
 */
export class BuildTokenGenerationPromptUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly palettes: PaletteRepository,
    private readonly tokens: DesignTokenRepository,
    private readonly benefits: BenefitRepository,
    private readonly personas: PersonaRepository,
    private readonly policies: PolicyRepository,
  ) {}

  async execute(input: BuildTokenGenerationPromptInput): Promise<LlmPrompt> {
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
    const existingNames = existing
      .filter((t) => t.group === input.group)
      .map((t) => t.name);

    return tokenGenerationTask.buildPrompt({
      context,
      group: input.group,
      density: input.density,
      palettes: paletteOptions,
      existingNames,
    });
  }
}
