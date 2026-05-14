import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { DrizzleProductRepository } from "../../../product/infrastructure/repositories/drizzle-product-repository";
import { TOKEN_GROUPS } from "../../../../client/entities/design-token";
import { SHADE_STEPS } from "../../../../client/entities/palette";
import { BuildAllTokensGenerationPromptUseCase } from "../../application/use-cases/build-all-tokens-generation-prompt";
import { BuildTokenGenerationPromptUseCase } from "../../application/use-cases/build-token-generation-prompt";
import { CreateDesignTokenUseCase } from "../../application/use-cases/create-design-token";
import { DeleteDesignTokenUseCase } from "../../application/use-cases/delete-design-token";
import { ListDesignTokensUseCase } from "../../application/use-cases/list-design-tokens";
import { SubmitAllTokensGenerationResponseUseCase } from "../../application/use-cases/submit-all-tokens-generation-response";
import { SubmitTokenGenerationResponseUseCase } from "../../application/use-cases/submit-token-generation-response";
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

const descriptionSchema = z.string().trim().max(500).optional();

const createInput = z
  .object({
    productId: z.string().uuid(),
    group: groupSchema,
    name: z.string().min(1).max(80),
    paletteId: z.string().uuid().optional(),
    paletteStep: stepSchema.optional(),
    rawValue: z.string().min(1).optional(),
    description: descriptionSchema,
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
  /* Pass null to explicitly clear; omit to leave untouched. */
  description: z.string().trim().max(500).nullable().optional(),
});

const idInput = z.object({ id: z.string().uuid() });
const productIdInput = z.object({ productId: z.string().uuid() });

/* LLM-driven generation. Manual flow today: FE pulls a prompt → user
 * runs it through an external LLM → FE submits the raw response. The
 * server parses + appends; when the API key lands, a single `run`
 * mutation can be added that chains build → provider.complete → submit
 * without changing the task or persistence. */
const DENSITIES = ["minimal", "balanced", "comprehensive"] as const;
const generationInputBase = z.object({
  productId: z.string().uuid(),
  group: groupSchema,
  density: z.enum(DENSITIES),
});
const submitGenerationInput = generationInputBase.extend({
  rawResponse: z.string().min(1),
});

/* Per-group generation: pick one group, generate just that group's tokens. */
const generationRouter = createTRPCRouter({
  buildPrompt: protectedProcedure
    .input(generationInputBase)
    .query(({ ctx, input }) =>
      new BuildTokenGenerationPromptUseCase(products, palettes, tokens).execute({
        productId: input.productId,
        userId: ctx.user.id,
        group: input.group as (typeof TOKEN_GROUPS)[number],
        density: input.density,
      }),
    ),
  submit: protectedProcedure
    .input(submitGenerationInput)
    .mutation(({ ctx, input }) =>
      new SubmitTokenGenerationResponseUseCase(products, palettes, tokens).execute({
        productId: input.productId,
        userId: ctx.user.id,
        group: input.group as (typeof TOKEN_GROUPS)[number],
        density: input.density,
        rawResponse: input.rawResponse,
      }),
    ),

  /* All-groups generation: one prompt, one response, all 5 groups
   * filled in a single LLM round trip. */
  allBuildPrompt: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        density: z.enum(DENSITIES),
      }),
    )
    .query(({ ctx, input }) =>
      new BuildAllTokensGenerationPromptUseCase(products, palettes, tokens).execute({
        productId: input.productId,
        userId: ctx.user.id,
        density: input.density,
      }),
    ),
  allSubmit: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        density: z.enum(DENSITIES),
        rawResponse: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      new SubmitAllTokensGenerationResponseUseCase(products, palettes, tokens).execute({
        productId: input.productId,
        userId: ctx.user.id,
        density: input.density,
        rawResponse: input.rawResponse,
      }),
    ),
});

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

  generation: generationRouter,
});
