import type { Persona } from "../entities/persona";

export interface PersonaRepository {
  findById(id: string): Promise<Persona | null>;
  findByProductId(productId: string): Promise<Persona[]>;
  save(persona: Persona): Promise<void>;
  delete(id: string): Promise<void>;
}
