import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import { TOKEN_GROUPS, type TokenGroup } from "@/kernel/design-token";
import { DesignToken } from "../../domain/entities/design-token";
import type { Palette } from "../../domain/entities/palette";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type DesignTokenDTO, toDesignTokenDTO } from "../dto/design-token.dto";
import { allTokensGenerationTask } from "../llm-tasks/all-tokens-generation-task";
import type {
  PaletteOption,
  TokenGenerationDensity,
} from "../llm-tasks/token-generation-task";

export interface SubmitAllTokensGenerationResponseInput {
  productId: string;
  userId: string;
  density: TokenGenerationDensity;
  rawResponse: string;
}

export interface SubmitAllTokensGenerationResponseOutput {
  /** All newly-created tokens, in insertion order. */
  created: DesignTokenDTO[];
  /** Names skipped due to collision, keyed by group. */
  skippedByGroup: Record<TokenGroup, string[]>;
}

/**
 * Persist the parsed result of an "all 5 groups" generation run.
 *
 * Append-only per group, same as the single-group submit — existing
 * tokens are left alone; new tokens are appended at the end of each
 * group's position order. Name collisions are skipped and reported.
 */
export class SubmitAllTokensGenerationResponseUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly palettes: PaletteRepository,
    private readonly tokens: DesignTokenRepository,
  ) {}

  async execute(
    input: SubmitAllTokensGenerationResponseInput,
  ): Promise<SubmitAllTokensGenerationResponseOutput> {
    const product = await loadOwnedProduct(this.products, input.productId, input.userId);

    const palettes = await this.palettes.findByProductId(input.productId);
    const paletteOptions: PaletteOption[] = palettes.map((p) => ({
      id: p.id,
      name: p.name,
      shades: p.shades(),
    }));
    const palettesById = new Map<string, Palette>(palettes.map((p) => [p.id, p]));

    const existing = await this.tokens.findByProductId(input.productId);
    /* Per-group state: existing names (for collision) + next position. */
    const namesByGroup = {} as Record<TokenGroup, Set<string>>;
    const positionByGroup = {} as Record<TokenGroup, number>;
    for (const g of TOKEN_GROUPS) {
      const inGroup = existing.filter((t) => t.group === g);
      namesByGroup[g] = new Set(inGroup.map((t) => t.name));
      positionByGroup[g] = inGroup.length;
    }

    const parsed = allTokensGenerationTask.parseResponse(input.rawResponse, {
      product,
      density: input.density,
      palettes: paletteOptions,
      existingNamesByGroup: Object.fromEntries(
        TOKEN_GROUPS.map((g) => [g, [...namesByGroup[g]]]),
      ) as Record<TokenGroup, string[]>,
    });

    const created: DesignTokenDTO[] = [];
    const skippedByGroup = Object.fromEntries(
      TOKEN_GROUPS.map((g) => [g, [] as string[]]),
    ) as Record<TokenGroup, string[]>;

    for (const spec of parsed.tokens) {
      if (namesByGroup[spec.group].has(spec.name)) {
        skippedByGroup[spec.group].push(spec.name);
        continue;
      }
      const token = DesignToken.create({
        productId: input.productId,
        group: spec.group,
        name: spec.name,
        position: positionByGroup[spec.group]++,
        description: spec.description,
        ...("rawValue" in spec
          ? { rawValue: spec.rawValue }
          : { paletteId: spec.paletteId, paletteStep: spec.paletteStep }),
      });
      await this.tokens.save(token);
      namesByGroup[spec.group].add(spec.name);
      created.push(toDesignTokenDTO(token, palettesById));
    }

    return { created, skippedByGroup };
  }
}
