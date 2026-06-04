import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreateProductUseCase } from "../../application/use-cases/create-product";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product";
import { GetProductUseCase } from "../../application/use-cases/get-product";
import { ListProductsUseCase } from "../../application/use-cases/list-products";
import { SetProductMissionUseCase } from "../../application/use-cases/set-product-mission";
import { UpdateProductDescriptionUseCase } from "../../application/use-cases/update-product-description";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";
import { prdRouter } from "./prd.router";
import { benefitRouter } from "./benefit.router";
import { personaRouter } from "./persona.router";

const productRepository = new DrizzleProductRepository();

const createInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const idInput = z.object({ id: z.string().uuid() });

const setMissionInput = z.object({
  id: z.string().uuid(),
  mission: z.string().nullable(),
});

const updateDescriptionInput = z.object({
  id: z.string().uuid(),
  description: z.string().nullable(),
});

export const productRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    new ListProductsUseCase(productRepository).execute(ctx.user.id),
  ),

  get: protectedProcedure.input(idInput).query(({ ctx, input }) =>
    new GetProductUseCase(productRepository).execute({ id: input.id, userId: ctx.user.id }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreateProductUseCase(productRepository).execute({ ...input, userId: ctx.user.id }),
  ),

  setMission: protectedProcedure.input(setMissionInput).mutation(({ ctx, input }) =>
    new SetProductMissionUseCase(productRepository).execute({ ...input, userId: ctx.user.id }),
  ),

  updateDescription: protectedProcedure.input(updateDescriptionInput).mutation(({ ctx, input }) =>
    new UpdateProductDescriptionUseCase(productRepository).execute({ ...input, userId: ctx.user.id }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeleteProductUseCase(productRepository).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),

  prd: prdRouter,
  benefit: benefitRouter,
  persona: personaRouter,
});
