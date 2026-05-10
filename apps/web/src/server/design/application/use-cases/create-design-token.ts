import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { TokenGroup } from "../../../../client/entities/design-token";
import type { Palette } from "../../domain/entities/palette";
import { DesignToken } from "../../domain/entities/design-token";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type DesignTokenDTO, toDesignTokenDTO } from "../dto/design-token.dto";

export interface CreateDesignTokenInput {
  productId: string;
  userId: string;
  group: TokenGroup;
  name: string;
  paletteId?: string | null;
  paletteStep?: number | null;
  rawValue?: string | null;
}

export class CreateDesignTokenUseCase {
  constructor(
    private readonly tokens: DesignTokenRepository,
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateDesignTokenInput): Promise<DesignTokenDTO> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have access to this product");
    }

    /* For color tokens, verify the referenced palette exists and belongs to
     * the same product — otherwise we'd allow cross-product palette refs. */
    if (input.group === "color") {
      if (!input.paletteId) throw new Error("Color token requires paletteId");
      const palette = await this.palettes.findById(input.paletteId);
      if (!palette || palette.productId !== input.productId) {
        throw new NotFoundError(`Palette ${input.paletteId} not found in this product`);
      }
    }

    const existing = await this.tokens.findByProductId(input.productId);
    const inGroup = existing.filter((t) => t.group === input.group);
    const position = inGroup.length;

    const token = DesignToken.create({
      productId: input.productId,
      group: input.group,
      name: input.name,
      position,
      paletteId: input.paletteId ?? null,
      paletteStep: input.paletteStep ?? null,
      rawValue: input.rawValue ?? null,
    });
    await this.tokens.save(token);

    const palettes = await this.palettes.findByProductId(input.productId);
    const byId = new Map<string, Palette>(palettes.map((p) => [p.id, p]));
    return toDesignTokenDTO(token, byId);
  }
}
