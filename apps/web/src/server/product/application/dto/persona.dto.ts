import type { Persona } from "../../domain/entities/persona";

export interface PersonaDTO {
  id: string;
  productId: string;
  label: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toPersonaDTO = (persona: Persona): PersonaDTO => ({
  id: persona.id,
  productId: persona.productId,
  label: persona.label,
  description: persona.description,
  position: persona.position,
  createdAt: persona.createdAt,
  updatedAt: persona.updatedAt,
});
