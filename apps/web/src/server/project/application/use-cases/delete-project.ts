import { ForbiddenError, NotFoundError } from "../../../shared/errors/domain-error";
import type { ProjectRepository } from "../../domain/repositories/project-repository";

export interface DeleteProjectInput {
  id: string;
  userId: string;
}

export class DeleteProjectUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    const project = await this.projects.findById(input.id);
    if (!project) {
      throw new NotFoundError(`Project ${input.id} not found`);
    }
    if (!project.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You don't have permission to delete this project");
    }
    await this.projects.delete(input.id);
  }
}
