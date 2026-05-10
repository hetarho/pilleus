import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
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
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have access to this product");
    }
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
