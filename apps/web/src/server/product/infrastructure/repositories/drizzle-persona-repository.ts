import { db, asc, eq } from "@pilleus/db";
import { persona as personaTable } from "@pilleus/db/schema";
import { Persona } from "../../domain/entities/persona";
import type { PersonaRepository } from "../../domain/repositories/persona-repository";

export class DrizzlePersonaRepository implements PersonaRepository {
  async findById(id: string): Promise<Persona | null> {
    const [row] = await db
      .select()
      .from(personaTable)
      .where(eq(personaTable.id, id))
      .limit(1);
    return row ? Persona.reconstitute(row) : null;
  }

  async findByProductId(productId: string): Promise<Persona[]> {
    const rows = await db
      .select()
      .from(personaTable)
      .where(eq(personaTable.productId, productId))
      .orderBy(asc(personaTable.position), asc(personaTable.createdAt));
    return rows.map((row) => Persona.reconstitute(row));
  }

  async save(persona: Persona): Promise<void> {
    await db
      .insert(personaTable)
      .values({
        id: persona.id,
        productId: persona.productId,
        label: persona.label,
        description: persona.description,
        position: persona.position,
        createdAt: persona.createdAt,
        updatedAt: persona.updatedAt,
      })
      .onConflictDoUpdate({
        target: personaTable.id,
        set: {
          label: persona.label,
          description: persona.description,
          position: persona.position,
          updatedAt: persona.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(personaTable).where(eq(personaTable.id, id));
  }
}
