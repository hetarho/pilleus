import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
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

    const product = await this.products.findById(palette.productId);
    if (!product || !product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to update this palette");
    }

    if (input.name !== undefined) palette.rename(input.name);
    if (input.seedHex !== undefined) palette.changeSeed(input.seedHex);

    await this.palettes.save(palette);
    return toPaletteDTO(palette);
  }
}
