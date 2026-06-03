import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type PaletteDTO, toPaletteDTO } from "../dto/palette.dto";

export interface UpdatePaletteInput {
  id: string;
  userId: string;
  name?: string;
  seedHex?: string;
}

export class UpdatePaletteUseCase {
  constructor(
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdatePaletteInput): Promise<PaletteDTO> {
    const palette = await this.palettes.findById(input.id);
    if (!palette) throw new NotFoundError(`Palette ${input.id} not found`);

    await loadOwnedProduct(this.products, palette.productId, input.userId);

    if (input.name !== undefined) palette.rename(input.name);
    if (input.seedHex !== undefined) palette.changeSeed(input.seedHex);

    await this.palettes.save(palette);
    return toPaletteDTO(palette);
  }
}
