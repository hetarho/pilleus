import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdListItemDTO, toPrdListItemDTO } from "../dto/prd.dto";

export class ListPrdsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
  ) {}

  async execute(input: { productId: string; userId: string }): Promise<PrdListItemDTO[]> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) throw new ForbiddenError("Access denied");

    const prds = await this.prds.findByProductId(input.productId);
    return prds.map(toPrdListItemDTO);
  }
}
