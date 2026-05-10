import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { DrizzleProductRepository } from "../../../product/infrastructure/repositories/drizzle-product-repository";
import { CreatePaletteUseCase } from "../../application/use-cases/create-palette";
import { DeletePaletteUseCase } from "../../application/use-cases/delete-palette";
import { ListPalettesUseCase } from "../../application/use-cases/list-palettes";
import { SeedDefaultPalettesUseCase } from "../../application/use-cases/seed-default-palettes";
import { UpdatePaletteUseCase } from "../../application/use-cases/update-palette";
import { DrizzlePaletteRepository } from "../../infrastructure/repositories/drizzle-palette-repository";

const palettes = new DrizzlePaletteRepository();
const products = new DrizzleProductRepository();

const hexSchema = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid hex color");

const createInput = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(50),
  seedHex: hexSchema,
});

const updateInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  seedHex: hexSchema.optional(),
});

const idInput = z.object({ id: z.string().uuid() });
const productIdInput = z.object({ productId: z.string().uuid() });

export const paletteRouter = createTRPCRouter({
  list: protectedProcedure.input(productIdInput).query(({ ctx, input }) =>
    new ListPalettesUseCase(palettes, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreatePaletteUseCase(palettes, products).execute({
      ...input,
      userId: ctx.user.id,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdatePaletteUseCase(palettes, products).execute({
      ...input,
      userId: ctx.user.id,
    }),
  ),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await new DeletePaletteUseCase(palettes, products).execute({
      id: input.id,
      userId: ctx.user.id,
    });
    return { success: true as const };
  }),

  /** One-shot helper used by the empty Design view's "기본 팔레트로 시작
   * 하기" affordance — seeds brand / neutral / accent. */
  seedDefaults: protectedProcedure.input(productIdInput).mutation(({ ctx, input }) =>
    new SeedDefaultPalettesUseCase(palettes, products).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),
});
