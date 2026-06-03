import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../../../product/application/load-owned-product";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";

export interface DeletePaletteInput {
  id: string;
  userId: string;
}

export class DeletePaletteUseCase {
  constructor(
    private readonly palettes: PaletteRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: DeletePaletteInput): Promise<void> {
    const palette = await this.palettes.findById(input.id);
    if (!palette) throw new NotFoundError(`Palette ${input.id} not found`);

    await loadOwnedProduct(this.products, palette.productId, input.userId);

    await this.palettes.delete(input.id);
  }
}
