import type { Project } from "../entities/project";

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
