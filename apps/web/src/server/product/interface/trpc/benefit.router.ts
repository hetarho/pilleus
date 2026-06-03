import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { CreateBenefitUseCase } from "../../application/use-cases/create-benefit";
import { DeleteBenefitUseCase } from "../../application/use-cases/delete-benefit";
import { ListBenefitsUseCase } from "../../application/use-cases/list-benefits";
import { UpdateBenefitUseCase } from "../../application/use-cases/update-benefit";
import { DrizzleBenefitRepository } from "../../infrastructure/repositories/drizzle-benefit-repository";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";

const benefits = new DrizzleBenefitRepository();
const products = new DrizzleProductRepository();

const listInput = z.object({ productId: z.string().uuid() });
const idInput = z.object({ id: z.string().uuid() });
const createInput = z.object({
  productId: z.string().uuid(),
  label: z.string().min(1).max(200),
});
const updateInput = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200),
});

export const benefitRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListBenefitsUseCase(benefits, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreateBenefitUseCase(benefits, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      label: input.label,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdateBenefitUseCase(benefits, products).execute({
      id: input.id,
      userId: ctx.user.id,
      label: input.label,
    }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeleteBenefitUseCase(benefits, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),
});
