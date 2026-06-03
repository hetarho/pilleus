import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";

export interface DeletePersonaInput {
  id: string;
  userId: string;
}

export class DeletePersonaUseCase {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: DeletePersonaInput): Promise<void> {
    const persona = await this.personas.findById(input.id);
    if (!persona) throw new NotFoundError(`Persona ${input.id} not found`);

    await loadOwnedProduct(this.products, persona.productId, input.userId);
    await this.personas.delete(input.id);
  }
}
