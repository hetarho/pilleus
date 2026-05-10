import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import { Palette } from "../../domain/entities/palette";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type PaletteDTO, toPaletteDTO } from "../dto/palette.dto";

/** Default seed colors offered as a one-click "start with these" option in
 * the empty Design view. Names and hexes mirror the conventional brand /
 * neutral / accent split most products end up with. */
const DEFAULT_PALETTES = [
  { name: "brand", seedHex: "#4f46e5" },
  { name: "neutral", seedHex: "#71717a" },
  { name: "accent", seedHex: "#10b981" },
] as const;

export class SeedDefaultPalettesUseCase {
  constructor(
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: { productId: string; userId: string }): Promise<PaletteDTO[]> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have access to this product");
    }
    const existing = await this.palettes.findByProductId(input.productId);
    let position = existing.length;
    const created: Palette[] = [];
    for (const def of DEFAULT_PALETTES) {
      const palette = Palette.create({
        productId: input.productId,
        name: def.name,
        seedHex: def.seedHex,
        position: position++,
      });
      await this.palettes.save(palette);
      created.push(palette);
    }
    return created.map(toPaletteDTO);
  }
}
