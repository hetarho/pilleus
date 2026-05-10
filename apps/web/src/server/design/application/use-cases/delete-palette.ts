import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
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

    const product = await this.products.findById(palette.productId);
    if (!product || !product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to delete this palette");
    }

    await this.palettes.delete(input.id);
  }
}
