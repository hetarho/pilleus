import { NotFoundError } from "../../../shared/errors/domain-error";
import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";
import { type PersonaDTO, toPersonaDTO } from "../dto/persona.dto";

export interface UpdatePersonaInput {
  id: string;
  userId: string;
  label?: string;
  description?: string | null;
}

export class UpdatePersonaUseCase {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdatePersonaInput): Promise<PersonaDTO> {
    const persona = await this.personas.findById(input.id);
    if (!persona) throw new NotFoundError(`Persona ${input.id} not found`);

    await loadOwnedProduct(this.products, persona.productId, input.userId);
    if (input.label !== undefined) persona.relabel(input.label);
    if (input.description !== undefined) persona.describe(input.description);
    await this.personas.save(persona);
    return toPersonaDTO(persona);
  }
}
