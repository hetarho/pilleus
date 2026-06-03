import { loadOwnedProduct } from "../load-owned-product";
import type { ProductRepository } from "../../domain/repositories/product-repository";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";
import { Persona } from "../../domain/entities/persona";
import { type PersonaDTO, toPersonaDTO } from "../dto/persona.dto";

export interface CreatePersonaInput {
  productId: string;
  userId: string;
  label: string;
  description?: string | null;
}

export class CreatePersonaUseCase {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreatePersonaInput): Promise<PersonaDTO> {
    await loadOwnedProduct(this.products, input.productId, input.userId);

    const existing = await this.personas.findByProductId(input.productId);
    const position =
      existing.length === 0 ? 0 : Math.max(...existing.map((p) => p.position)) + 1;

    const persona = Persona.create({
      productId: input.productId,
      label: input.label,
      description: input.description,
      position,
    });
    await this.personas.save(persona);
    return toPersonaDTO(persona);
  }
}
