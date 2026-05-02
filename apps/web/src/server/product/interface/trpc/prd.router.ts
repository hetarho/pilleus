import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreatePrdUseCase } from "../../application/use-cases/create-prd";
import { DeletePrdUseCase } from "../../application/use-cases/delete-prd";
import { GetPrdUseCase } from "../../application/use-cases/get-prd";
import { ListPrdsUseCase } from "../../application/use-cases/list-prds";
import { UpdatePrdUseCase } from "../../application/use-cases/update-prd";
import { DrizzlePrdRepository } from "../../infrastructure/repositories/drizzle-prd-repository";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";

const productRepo = new DrizzleProductRepository();
const prdRepo = new DrizzlePrdRepository();

const listInput = z.object({ productId: z.string().uuid() });
const getInput = z.object({ id: z.string().uuid() });
const createInput = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1).max(200),
  benefitIndex: z.number().int().nonnegative().nullable().optional(),
});
const updateInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  benefitIndex: z.number().int().nonnegative().nullable().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published", "ai_reviewed"]).optional(),
  aiReviewedContent: z.string().nullable().optional(),
});
const deleteInput = z.object({ id: z.string().uuid() });

export const prdRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListPrdsUseCase(productRepo, prdRepo).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  get: protectedProcedure.input(getInput).query(({ ctx, input }) =>
    new GetPrdUseCase(productRepo, prdRepo).execute({ id: input.id, userId: ctx.user.id }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreatePrdUseCase(productRepo, prdRepo).execute({ ...input, userId: ctx.user.id }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdatePrdUseCase(productRepo, prdRepo).execute({ ...input, userId: ctx.user.id }),
  ),

  delete: protectedProcedure.input(deleteInput).mutation(async ({ ctx, input }) => {
    await new DeletePrdUseCase(productRepo, prdRepo).execute({ id: input.id, userId: ctx.user.id });
    return { success: true as const };
  }),
});
