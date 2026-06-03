import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import { EMPTY_PROMPT_CONTEXT } from "../../../product/application/product-prompt-context";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { TokenGroup } from "@/kernel/design-token";
import { DesignToken } from "../../domain/entities/design-token";
import type { Palette } from "../../domain/entities/palette";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type DesignTokenDTO, toDesignTokenDTO } from "../dto/design-token.dto";
import {
  tokenGenerationTask,
  type PaletteOption,
  type TokenGenerationDensity,
} from "../llm-tasks/token-generation-task";

export interface SubmitTokenGenerationResponseInput {
  productId: string;
  userId: string;
  group: TokenGroup;
  density: TokenGenerationDensity;
  rawResponse: string;
}

export interface SubmitTokenGenerationResponseOutput {
  /** Tokens created in this call. */
  created: DesignTokenDTO[];
  /** Names that collided with existing tokens — silently skipped so a
   * retry with a slightly tweaked LLM response doesn't blow up. */
  skipped: string[];
}

/**
 * Persist the parsed result of one token-generation LLM run.
 *
 * Append-only: existing tokens in the group are left alone, new tokens
 * are appended at the end of the group's position order. Name collisions
 * are skipped (and reported back).
 */
export class SubmitTokenGenerationResponseUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly palettes: PaletteRepository,
    private readonly tokens: DesignTokenRepository,
  ) {}

  async execute(
    input: SubmitTokenGenerationResponseInput,
  ): Promise<SubmitTokenGenerationResponseOutput> {
    await loadOwnedProduct(this.products, input.productId, input.userId);

    const palettes = await this.palettes.findByProductId(input.productId);
    const paletteOptions: PaletteOption[] = palettes.map((p) => ({
      id: p.id,
      name: p.name,
      shades: p.shades(),
    }));
    const palettesById = new Map<string, Palette>(palettes.map((p) => [p.id, p]));

    const existing = await this.tokens.findByProductId(input.productId);
    const existingNamesInGroup = new Set(
      existing.filter((t) => t.group === input.group).map((t) => t.name),
    );

    const parsed = tokenGenerationTask.parseResponse(input.rawResponse, {
      context: EMPTY_PROMPT_CONTEXT,
      group: input.group,
      density: input.density,
      palettes: paletteOptions,
      existingNames: [...existingNamesInGroup],
    });

    let nextPosition = existing.filter((t) => t.group === input.group).length;
    const created: DesignTokenDTO[] = [];
    const skipped: string[] = [];

    for (const spec of parsed.tokens) {
      if (existingNamesInGroup.has(spec.name)) {
        skipped.push(spec.name);
        continue;
      }
      const token = DesignToken.create({
        productId: input.productId,
        group: input.group,
        name: spec.name,
        position: nextPosition++,
        description: spec.description,
        ...("rawValue" in spec
          ? { rawValue: spec.rawValue }
          : { paletteId: spec.paletteId, paletteStep: spec.paletteStep }),
      });
      await this.tokens.save(token);
      existingNamesInGroup.add(spec.name);
      created.push(toDesignTokenDTO(token, palettesById));
    }

    return { created, skipped };
  }
}
