import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { LlmPrompt } from "../../../shared/llm";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import { TOKEN_GROUPS, type TokenGroup } from "../../../../client/entities/design-token";
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
  ) {}

  async execute(input: BuildAllTokensGenerationPromptInput): Promise<LlmPrompt> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) throw new ForbiddenError("Access denied");

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
      product,
      density: input.density,
      palettes: paletteOptions,
      existingNamesByGroup,
    });
  }
}
