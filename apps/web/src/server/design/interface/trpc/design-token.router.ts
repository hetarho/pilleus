import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { DrizzleProductRepository } from "../../../product/infrastructure/repositories/drizzle-product-repository";
import { TOKEN_GROUPS } from "../../../../client/entities/design-token";
import { SHADE_STEPS } from "../../../../client/entities/palette";
import { CreateDesignTokenUseCase } from "../../application/use-cases/create-design-token";
import { DeleteDesignTokenUseCase } from "../../application/use-cases/delete-design-token";
import { ListDesignTokensUseCase } from "../../application/use-cases/list-design-tokens";
import { UpdateDesignTokenUseCase } from "../../application/use-cases/update-design-token";
import { DrizzleDesignTokenRepository } from "../../infrastructure/repositories/drizzle-design-token-repository";
import { DrizzlePaletteRepository } from "../../infrastructure/repositories/drizzle-palette-repository";

const tokens = new DrizzleDesignTokenRepository();
const palettes = new DrizzlePaletteRepository();
const products = new DrizzleProductRepository();

const groupSchema = z.enum([...TOKEN_GROUPS] as [string, ...string[]]);
const stepSchema = z
  .number()
  .refine((n) => (SHADE_STEPS as readonly number[]).includes(n), "Invalid palette step");

const createInput = z
  .object({
    productId: z.string().uuid(),
    group: groupSchema,
    name: z.string().min(1).max(80),
    paletteId: z.string().uuid().optional(),
    paletteStep: stepSchema.optional(),
    rawValue: z.string().min(1).optional(),
  })
  .refine(
    (v) =>
      v.group === "color"
        ? v.paletteId !== undefined && v.paletteStep !== undefined && v.rawValue === undefined
        : v.rawValue !== undefined && v.paletteId === undefined && v.paletteStep === undefined,
    {
      message:
        "color tokens require paletteId+paletteStep; non-color tokens require rawValue",
    },
  );

const updateInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  paletteId: z.string().uuid().optional(),
  paletteStep: stepSchema.optional(),
  rawValue: z.string().min(1).optional(),
});

const idInput = z.object({ id: z.string().uuid() });
const productIdInput = z.object({ productId: z.string().uuid() });

export const designTokenRouter = createTRPCRouter({
  list: protectedProcedure.input(productIdInput).query(({ ctx, input }) =>
    new ListDesignTokensUseCase(tokens, palettes, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreateDesignTokenUseCase(tokens, palettes, products).execute({
      ...input,
      group: input.group as (typeof TOKEN_GROUPS)[number],
      userId: ctx.user.id,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdateDesignTokenUseCase(tokens, palettes, products).execute({
      ...input,
      userId: ctx.user.id,
    }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeleteDesignTokenUseCase(tokens, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),
});
