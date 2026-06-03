import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { DrizzleProductRepository } from "../../../product/infrastructure/repositories/drizzle-product-repository";
import { REFERENCE_KINDS, type ReferenceKind } from "@/kernel/reference";
import { AddReferenceUseCase } from "../../application/use-cases/add-reference";
import { ListBacklinksUseCase } from "../../application/use-cases/list-backlinks";
import { ListReferencesUseCase } from "../../application/use-cases/list-references";
import { RemoveReferenceUseCase } from "../../application/use-cases/remove-reference";
import { DrizzleReferenceRepository } from "../../infrastructure/repositories/drizzle-reference-repository";

const references = new DrizzleReferenceRepository();
const products = new DrizzleProductRepository();

const kindSchema = z.enum(
  REFERENCE_KINDS as unknown as [ReferenceKind, ...ReferenceKind[]],
);

const addInput = z.object({
  productId: z.string().uuid(),
  sourceKind: kindSchema,
  sourceId: z.string().min(1),
  targetKind: kindSchema,
  targetId: z.string().min(1),
});
const removeInput = z.object({ id: z.string().uuid() });
const listInput = z.object({
  productId: z.string().uuid(),
  sourceKind: kindSchema,
  sourceId: z.string().min(1),
});
const backlinksInput = z.object({
  productId: z.string().uuid(),
  targetKind: kindSchema,
  targetId: z.string().min(1),
});

export const referenceRouter = createTRPCRouter({
  /** Forward edges — what the given source artifact imports. */
  listBySource: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListReferencesUseCase(references, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
    }),
  ),

  /** Backlinks — which artifacts import the given target concept. */
  backlinks: protectedProcedure.input(backlinksInput).query(({ ctx, input }) =>
    new ListBacklinksUseCase(references, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      targetKind: input.targetKind,
      targetId: input.targetId,
    }),
  ),

  add: protectedProcedure.input(addInput).mutation(({ ctx, input }) =>
    new AddReferenceUseCase(references, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      targetKind: input.targetKind,
      targetId: input.targetId,
    }),
  ),

  remove: protectedProcedure.input(removeInput).mutation(async ({ ctx, input }) => {
    await new RemoveReferenceUseCase(references, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),
});
