import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import { Palette } from "../../domain/entities/palette";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type PaletteDTO, toPaletteDTO } from "../dto/palette.dto";

export interface CreatePaletteInput {
  productId: string;
  userId: string;
  name: string;
  seedHex: string;
}

export class CreatePaletteUseCase {
  constructor(
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreatePaletteInput): Promise<PaletteDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const existing = await this.palettes.findByProductId(input.productId);
    const position = existing.length;
    const palette = Palette.create({
      productId: input.productId,
      name: input.name,
      seedHex: input.seedHex,
      position,
    });
    await this.palettes.save(palette);
    return toPaletteDTO(palette);
  }
}
