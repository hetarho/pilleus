import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type PaletteDTO, toPaletteDTO } from "../dto/palette.dto";

export class ListPalettesUseCase {
  constructor(
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: { productId: string; userId: string }): Promise<PaletteDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const palettes = await this.palettes.findByProductId(input.productId);
    return palettes.map(toPaletteDTO);
  }
}
