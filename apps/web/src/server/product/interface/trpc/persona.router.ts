import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreatePersonaUseCase } from "../../application/use-cases/create-persona";
import { DeletePersonaUseCase } from "../../application/use-cases/delete-persona";
import { ListPersonasUseCase } from "../../application/use-cases/list-personas";
import { UpdatePersonaUseCase } from "../../application/use-cases/update-persona";
import { DrizzlePersonaRepository } from "../../infrastructure/repositories/drizzle-persona-repository";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";

const personas = new DrizzlePersonaRepository();
const products = new DrizzleProductRepository();

const listInput = z.object({ productId: z.string().uuid() });
const idInput = z.object({ id: z.string().uuid() });
const createInput = z.object({
  productId: z.string().uuid(),
  label: z.string().min(1).max(200),
  description: z.string().max(1_000).nullable().optional(),
});
const updateInput = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(1_000).nullable().optional(),
});

export const personaRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListPersonasUseCase(personas, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreatePersonaUseCase(personas, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      label: input.label,
      description: input.description,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdatePersonaUseCase(personas, products).execute({
      id: input.id,
      userId: ctx.user.id,
      label: input.label,
      description: input.description,
    }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeletePersonaUseCase(personas, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),
});
