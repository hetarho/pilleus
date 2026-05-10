import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { Palette } from "../../domain/entities/palette";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type DesignTokenDTO, toDesignTokenDTO } from "../dto/design-token.dto";

export interface UpdateDesignTokenInput {
  id: string;
  userId: string;
  name?: string;
  /* Color tokens. Either both paletteId+paletteStep or neither. */
  paletteId?: string;
  paletteStep?: number;
  /** Non-color tokens. */
  rawValue?: string;
}

export class UpdateDesignTokenUseCase {
  constructor(
    private readonly tokens: DesignTokenRepository,
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdateDesignTokenInput): Promise<DesignTokenDTO> {
    const token = await this.tokens.findById(input.id);
    if (!token) throw new NotFoundError(`Token ${input.id} not found`);

    const product = await this.products.findById(token.productId);
    if (!product || !product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to update this token");
    }

    if (input.name !== undefined) token.rename(input.name);

    if (token.group === "color") {
      if (input.paletteId !== undefined && input.paletteStep !== undefined) {
        const p = await this.palettes.findById(input.paletteId);
        if (!p || p.productId !== token.productId) {
          throw new NotFoundError(`Palette ${input.paletteId} not found in this product`);
        }
        token.setColorRef(input.paletteId, input.paletteStep);
      }
    } else if (input.rawValue !== undefined) {
      token.setRawValue(input.rawValue);
    }

    await this.tokens.save(token);

    const palettes = await this.palettes.findByProductId(token.productId);
    const byId = new Map<string, Palette>(palettes.map((p) => [p.id, p]));
    return toDesignTokenDTO(token, byId);
  }
}
