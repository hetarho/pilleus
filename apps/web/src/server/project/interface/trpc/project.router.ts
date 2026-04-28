import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreateProjectUseCase } from "../../application/use-cases/create-project";
import { DeleteProjectUseCase } from "../../application/use-cases/delete-project";
import { ListProjectsUseCase } from "../../application/use-cases/list-projects";
import { DrizzleProjectRepository } from "../../infrastructure/repositories/drizzle-project-repository";

const projectRepository = new DrizzleProjectRepository();

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const deleteProjectSchema = z.object({
  id: z.string().uuid(),
});

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const useCase = new ListProjectsUseCase(projectRepository);
    return useCase.execute(ctx.user.id);
  }),

  create: protectedProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
    const useCase = new CreateProjectUseCase(projectRepository);
    return useCase.execute({ ...input, userId: ctx.user.id });
  }),

  delete: protectedProcedure.input(deleteProjectSchema).mutation(async ({ ctx, input }) => {
    const useCase = new DeleteProjectUseCase(projectRepository);
    await useCase.execute({ id: input.id, userId: ctx.user.id });
    return { success: true as const };
  }),
});
