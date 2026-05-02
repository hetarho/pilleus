import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreateProductUseCase } from "../../application/use-cases/create-product";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product";
import { GetProductUseCase } from "../../application/use-cases/get-product";
import { ListProductsUseCase } from "../../application/use-cases/list-products";
import { UpdateProductOverviewUseCase } from "../../application/use-cases/update-product-overview";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";
import { prdRouter } from "./prd.router";

const productRepository = new DrizzleProductRepository();

const createInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const idInput = z.object({ id: z.string().uuid() });

const updateOverviewInput = z.object({
  id: z.string().uuid(),
  mission: z.string().nullable(),
  benefits: z.array(z.string()),
  principles: z.array(z.string()),
  actors: z.array(z.string()),
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

  updateOverview: protectedProcedure.input(updateOverviewInput).mutation(({ ctx, input }) =>
    new UpdateProductOverviewUseCase(productRepository).execute({ ...input, userId: ctx.user.id }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeleteProductUseCase(productRepository).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),

  prd: prdRouter,
});
