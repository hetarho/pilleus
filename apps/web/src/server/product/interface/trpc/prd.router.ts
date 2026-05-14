import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { BuildPrdCompletionPromptUseCase } from "../../application/use-cases/build-prd-completion-prompt";
import { CreatePrdUseCase } from "../../application/use-cases/create-prd";
import { DeletePrdUseCase } from "../../application/use-cases/delete-prd";
import { GetPrdUseCase } from "../../application/use-cases/get-prd";
import { GetPrdVersionUseCase } from "../../application/use-cases/get-prd-version";
import { ListPrdsUseCase } from "../../application/use-cases/list-prds";
import { ListPrdVersionsUseCase } from "../../application/use-cases/list-prd-versions";
import { SubmitPrdCompletionResponseUseCase } from "../../application/use-cases/submit-prd-completion-response";
import { UpdatePrdUseCase } from "../../application/use-cases/update-prd";
import { DrizzlePrdRepository } from "../../infrastructure/repositories/drizzle-prd-repository";
import { DrizzlePrdVersionRepository } from "../../infrastructure/repositories/drizzle-prd-version-repository";
import { DrizzleProductRepository } from "../../infrastructure/repositories/drizzle-product-repository";

const productRepo = new DrizzleProductRepository();
const prdRepo = new DrizzlePrdRepository();
const versionRepo = new DrizzlePrdVersionRepository();

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

const listVersionsInput = z.object({ prdId: z.string().uuid() });
const getVersionInput = z.object({ id: z.string().uuid() });

/* LLM-driven PRD completion. Today the FE drives the two halves
 * separately (build the prompt → user pastes the LLM output → submit).
 * When we add a server-side LLM provider, a single `run` mutation can be
 * added here without changing either the task or the persistence path. */
const buildCompletionPromptInput = z.object({ id: z.string().uuid() });
const submitCompletionResponseInput = z.object({
  id: z.string().uuid(),
  rawResponse: z.string().min(1),
});

const completionRouter = createTRPCRouter({
  buildPrompt: protectedProcedure
    .input(buildCompletionPromptInput)
    .query(({ ctx, input }) =>
      new BuildPrdCompletionPromptUseCase(productRepo, prdRepo).execute({
        prdId: input.id,
        userId: ctx.user.id,
      }),
    ),
  submit: protectedProcedure
    .input(submitCompletionResponseInput)
    .mutation(({ ctx, input }) =>
      new SubmitPrdCompletionResponseUseCase(productRepo, prdRepo, versionRepo).execute({
        prdId: input.id,
        userId: ctx.user.id,
        rawResponse: input.rawResponse,
      }),
    ),
});

const versionsRouter = createTRPCRouter({
  list: protectedProcedure.input(listVersionsInput).query(({ ctx, input }) =>
    new ListPrdVersionsUseCase(productRepo, prdRepo, versionRepo).execute({
      prdId: input.prdId,
      userId: ctx.user.id,
    }),
  ),
  get: protectedProcedure.input(getVersionInput).query(({ ctx, input }) =>
    new GetPrdVersionUseCase(productRepo, prdRepo, versionRepo).execute({
      id: input.id,
      userId: ctx.user.id,
    }),
  ),
});

export const prdRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    new ListPrdsUseCase(productRepo, prdRepo, versionRepo).execute({
      productId: input.productId,
      userId: ctx.user.id,
    }),
  ),

  get: protectedProcedure.input(getInput).query(({ ctx, input }) =>
    new GetPrdUseCase(productRepo, prdRepo).execute({ id: input.id, userId: ctx.user.id }),
  ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    new CreatePrdUseCase(productRepo, prdRepo, versionRepo).execute({
      ...input,
      userId: ctx.user.id,
    }),
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) =>
    new UpdatePrdUseCase(productRepo, prdRepo, versionRepo).execute({
      ...input,
      userId: ctx.user.id,
    }),
  ),

  delete: protectedProcedure.input(deleteInput).mutation(async ({ ctx, input }) => {
    await new DeletePrdUseCase(productRepo, prdRepo).execute({ id: input.id, userId: ctx.user.id });
    return { success: true as const };
  }),

  versions: versionsRouter,
  completion: completionRouter,
});
