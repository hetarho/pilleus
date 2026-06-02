import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { DrizzleProductRepository } from "../../../product/infrastructure/repositories/drizzle-product-repository";
import {
  POLICY_CATEGORIES,
  isValidSectionFor,
  type PolicyCategory,
} from "@/kernel/policy";
import { CreatePolicyUseCase } from "../../application/use-cases/create-policy";
import { DeletePolicyUseCase } from "../../application/use-cases/delete-policy";
import { ListPoliciesUseCase } from "../../application/use-cases/list-policies";
import { UpdatePolicyUseCase } from "../../application/use-cases/update-policy";
import { DrizzlePolicyRepository } from "../../infrastructure/repositories/drizzle-policy-repository";

const policies = new DrizzlePolicyRepository();
const products = new DrizzleProductRepository();

const categorySchema = z.enum(
  POLICY_CATEGORIES as unknown as [PolicyCategory, ...PolicyCategory[]],
);

const listInput = z.object({ productId: z.string().uuid() });
const idInput = z.object({ id: z.string().uuid() });
const createInput = z
  .object({
    productId: z.string().uuid(),
    category: categorySchema,
    section: z.string().nullable(),
    title: z.string().min(1).max(200),
    body: z.string().max(10_000).default(""),
  })
  .refine((v) => isValidSectionFor(v.category, v.section), {
    message: "section is not valid for the given category",
    path: ["section"],
  });
const updateInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(10_000).optional(),
  section: z.string().nullable().optional(),
});

export const policyRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListPoliciesUseCase(policies, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreatePolicyUseCase(policies, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
      category: input.category,
      section: input.section,
      title: input.title,
      body: input.body,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdatePolicyUseCase(policies, products).execute({
      id: input.id,
      userId: ctx.user.id,
      title: input.title,
      body: input.body,
      section: input.section,
    }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeletePolicyUseCase(policies, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),
});
