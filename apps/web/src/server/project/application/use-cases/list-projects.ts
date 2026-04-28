import type { ProjectRepository } from "../../domain/repositories/project-repository";
import { type ProjectDTO, toProjectDTO } from "../dto/project.dto";

export class ListProjectsUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(userId: string): Promise<ProjectDTO[]> {
    const projects = await this.projects.findByUserId(userId);
    return projects.map(toProjectDTO);
  }
}
