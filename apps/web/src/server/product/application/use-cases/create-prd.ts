import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/domain-error";
import { Prd } from "../../domain/entities/prd";
import type { PrdRepository } from "../../domain/repositories/prd-repository";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import { type PrdDTO, toPrdDTO } from "../dto/prd.dto";

export interface CreatePrdInput {
  productId: string;
  userId: string;
  title: string;
  benefitIndex?: number | null;
}

export class CreatePrdUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly prds: PrdRepository,
  ) {}

  async execute(input: CreatePrdInput): Promise<PrdDTO> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError(`Product ${input.productId} not found`);
    if (!product.isOwnedBy(input.userId)) throw new ForbiddenError("Access denied");

    if (input.benefitIndex != null) {
      if (input.benefitIndex < 0 || input.benefitIndex >= product.benefits.length) {
        throw new ValidationError("benefitIndex out of range for the product's benefits");
      }
    }

    const prd = Prd.create({
      productId: input.productId,
      title: input.title,
      benefitIndex: input.benefitIndex ?? null,
    });
    await this.prds.save(prd);
    return toPrdDTO(prd);
  }
}
