import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import {
  connectLlmCredentialUseCase,
  disconnectLlmCredentialUseCase,
  getLlmCatalogUseCase,
  listLlmCredentialsUseCase,
} from "../../composition";

/* BYOK credential management. The key is sent once on connect, encrypted
 * server-side, and never returned — `list` exposes only providerId + a hint. */
const connectInput = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(8),
});
const disconnectInput = z.object({ providerId: z.string().min(1) });

const credentialRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    listLlmCredentialsUseCase().execute({ userId: ctx.user.id }),
  ),
  connect: protectedProcedure
    .input(connectInput)
    .mutation(({ ctx, input }) =>
      connectLlmCredentialUseCase().execute({
        userId: ctx.user.id,
        providerId: input.providerId,
        apiKey: input.apiKey,
      }),
    ),
  disconnect: protectedProcedure
    .input(disconnectInput)
    .mutation(async ({ ctx, input }) => {
      await disconnectLlmCredentialUseCase().execute({
        userId: ctx.user.id,
        providerId: input.providerId,
      });
      return { success: true as const };
    }),
});

/**
 * `llm` context's inbound surface:
 *   - catalog: providers/models + per-user credential availability (picker)
 *   - credential: connect / disconnect / list connected keys (마이페이지)
 * Per-task `run` mutations live on their owning routers.
 */
export const llmRouter = createTRPCRouter({
  catalog: protectedProcedure.query(({ ctx }) =>
    getLlmCatalogUseCase().execute({ userId: ctx.user.id }),
  ),
  credential: credentialRouter,
});
