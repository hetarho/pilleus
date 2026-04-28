import { Project } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repositories/project-repository";
import { type ProjectDTO, toProjectDTO } from "../dto/project.dto";

export interface CreateProjectInput {
  name: string;
  description?: string;
  userId: string;
}

export class CreateProjectUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<ProjectDTO> {
    const project = Project.create({
      name: input.name,
      description: input.description ?? null,
      userId: input.userId,
    });
    await this.projects.save(project);
    return toProjectDTO(project);
  }
}
