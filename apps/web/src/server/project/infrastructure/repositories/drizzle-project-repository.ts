import { db, eq } from "@pilleus/db";
import { project as projectTable } from "@pilleus/db/schema";
import { Project } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repositories/project-repository";

export class DrizzleProjectRepository implements ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const [row] = await db.select().from(projectTable).where(eq(projectTable.id, id)).limit(1);
    return row ? Project.reconstitute(row) : null;
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const rows = await db.select().from(projectTable).where(eq(projectTable.userId, userId));
    return rows.map((row) => Project.reconstitute(row));
  }

  async save(project: Project): Promise<void> {
    await db
      .insert(projectTable)
      .values({
        id: project.id,
        name: project.name.value,
        description: project.description,
        userId: project.userId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .onConflictDoUpdate({
        target: projectTable.id,
        set: {
          name: project.name.value,
          description: project.description,
          updatedAt: project.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(projectTable).where(eq(projectTable.id, id));
  }
}
