import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { Palette } from "../../domain/entities/palette";
import type { DesignTokenRepository } from "../../domain/repositories/design-token-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type DesignTokenDTO, toDesignTokenDTO } from "../dto/design-token.dto";

export class ListDesignTokensUseCase {
  constructor(
    private readonly tokens: DesignTokenRepository,
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: { productId: string; userId: string }): Promise<DesignTokenDTO[]> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have access to this product");
    }
    const [tokens, palettes] = await Promise.all([
      this.tokens.findByProductId(input.productId),
      this.palettes.findByProductId(input.productId),
    ]);
    const palettesById = new Map<string, Palette>(palettes.map((p) => [p.id, p]));
    return tokens.map((t) => toDesignTokenDTO(t, palettesById));
  }
}
