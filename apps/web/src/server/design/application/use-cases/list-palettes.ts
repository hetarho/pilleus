import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProductRepository } from "../../../product/domain/repositories/product-repository";
import type { PaletteRepository } from "../../domain/repositories/palette-repository";
import { type PaletteDTO, toPaletteDTO } from "../dto/palette.dto";

export class ListPalettesUseCase {
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
    const palettes = await this.palettes.findByProductId(input.productId);
    return palettes.map(toPaletteDTO);
  }
}
