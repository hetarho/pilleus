import type { Project } from "../../domain/entities/project";

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const toProjectDTO = (project: Project): ProjectDTO => ({
  id: project.id,
  name: project.name.value,
  description: project.description,
  userId: project.userId,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});
