import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";
import { type PersonaDTO, toPersonaDTO } from "../dto/persona.dto";

export interface ListPersonasInput {
  productId: string;
  userId: string;
}

export class ListPersonasUseCase {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ListPersonasInput): Promise<PersonaDTO[]> {
    await loadOwnedProduct(this.products, input.productId, input.userId);
    const rows = await this.personas.findByProductId(input.productId);
    return rows.map(toPersonaDTO);
  }
}
